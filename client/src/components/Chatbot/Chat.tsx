import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import styles from './Chat.module.css';
import UserContext from '../../context/UserContext';
import jsPDF from 'jspdf';
import { API_PATHS } from '../../config/Config';
interface Message {
    type: 'user' | 'bot';
    content: string;
    timestamp: string;
    conversationId?: string;
    isImage?: boolean;
    imageData?: string;
}

const Chat: React.FC = () => {
    const { userData } = useContext(UserContext);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 300, height: 400 });
    const [position, setPosition] = useState(() => ({
        x: window.innerWidth - 400, // assuming initial width is 400px
        y: window.innerHeight - 600 // assuming initial height is 600px
    }));
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ x: number; y: number } | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeType, setResizeType] = useState<'horizontal' | 'vertical' | null>(null);
    const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
    const [conversationId, setConversationId] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageUploading, setImageUploading] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatBotResponse = (response: string) => {
        // Remove the retrieval instructions since we'll handle it in the UI
        const content = response.split('Want to view this conversation later?')[0];

        return {
            formattedContent: content
                .split('**')
                .filter(Boolean)
                .map(section => {
                    if (section.includes(':')) {
                        const [title, text] = section.split(':');
                        return `• ${title}:\n   ${text.trim()}`;
                    }
                    return section;
                })
                .join('\n\n')
                .trim()
        };
    };

    const handleSend = async () => {
        if (!inputValue.trim() || !userData.user) return;

        const userMessage = {
            type: 'user' as const,
            content: inputValue,
            timestamp: new Date().toLocaleTimeString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setLoading(true);

        try {
            const token = sessionStorage.getItem('auth-token');
            const response = await axios.post(
                `${API_PATHS.CHAT}/chat`,
                {
                    user_id: userData.user.id,
                    message: inputValue
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const { formattedContent } = formatBotResponse(response.data.response);

            const botMessage = {
                type: 'bot' as const,
                content: formattedContent,
                timestamp: new Date().toLocaleTimeString()
            };

            setMessages(prev => [...prev, botMessage]);
            setConversationId(response.data.conversation_id);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                type: 'bot' as const,
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, errorMessage]);
        }

        setLoading(false);
    };

    const handleImageUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !userData.user) return;

        const file = files[0];

        console.log('File selected:', {
            name: file.name,
            type: file.type,
            size: `${(file.size / 1024).toFixed(2)} KB`
        });

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (JPEG, PNG, WEBP,etc.)');
            return;
        }

        // Create a preview of the image
        const reader = new FileReader();
        reader.onload = async (e) => {
            const imageData = e.target?.result as string;

            // Add user message with image
            const userMessage = {
                type: 'user' as const,
                content: 'I uploaded a food image for analysis',
                timestamp: new Date().toLocaleTimeString(),
                isImage: true,
                imageData
            };

            setMessages(prev => [...prev, userMessage]);
            setImageUploading(true);

            try {
                // Create form data
                const formData = new FormData();
                formData.append('image_file', file);
                if (!userData.user) {
                    throw new Error('User data is missing');
                }
                formData.append('user_id', userData.user.id);
                formData.append('return_ocr_text', 'true');

                const token = sessionStorage.getItem('auth-token');

                // Log the request details for debugging
                console.log('Sending image to backend using the same pattern as chat endpoint');

                // Use the same API_PATHS.CHAT pattern as the regular chat functionality
                const response = await axios.post(
                    `${API_PATHS.CHAT}/process_food_image`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                // Format the response for display
                let responseContent = '';

                if (response.data.success) {
                    if (response.data.image_type === 'label') {
                        // Format nutrition label data
                        const nutrition = response.data.nutrition_info;
                        responseContent = `📋 **Nutrition Label Analysis**\n\n`;
                        responseContent += `**Product**: ${nutrition.food_name || 'Unknown'}\n`;
                        responseContent += `**Serving Size**: ${nutrition.serving_size || 'Not specified'}\n\n`;
                        responseContent += `**Nutrition Facts**:\n`;
                        responseContent += `• Calories: ${nutrition.calories || 'N/A'}\n`;
                        responseContent += `• Total Fat: ${nutrition.total_fat || 'N/A'}g\n`;
                        responseContent += `• Saturated Fat: ${nutrition.saturated_fat || 'N/A'}g\n`;
                        responseContent += `• Trans Fat: ${nutrition.trans_fat || 'N/A'}g\n`;
                        responseContent += `• Cholesterol: ${nutrition.cholesterol || 'N/A'}mg\n`;
                        responseContent += `• Sodium: ${nutrition.sodium || 'N/A'}mg\n`;
                        responseContent += `• Total Carbs: ${nutrition.total_carbohydrates || 'N/A'}g\n`;
                        responseContent += `• Dietary Fiber: ${nutrition.dietary_fiber || 'N/A'}g\n`;
                        responseContent += `• Sugars: ${nutrition.sugars || 'N/A'}g\n`;
                        responseContent += `• Protein: ${nutrition.protein || 'N/A'}g\n`;
                    } else {
                        // Format food image analysis
                        const foodAnalysis = response.data.food_analysis;
                        responseContent = `🍽️ **Food Analysis**\n\n`;
                        responseContent += `**Meal**: ${foodAnalysis.meal_description || 'Unknown meal'}\n\n`;
                        responseContent += `**Food Items**:\n`;

                        if (foodAnalysis.food_items && foodAnalysis.food_items.length > 0) {
                            foodAnalysis.food_items.forEach((item: any, index: number) => {
                                responseContent += `${index + 1}. ${item.food_name} (${item.portion_size || 'Unknown portion'})\n`;
                                responseContent += `   • Calories: ${item.calories || 'N/A'}\n`;
                                responseContent += `   • Protein: ${item.protein || 'N/A'}g\n`;
                                responseContent += `   • Carbs: ${item.carbohydrates || 'N/A'}g\n`;
                                responseContent += `   • Fat: ${item.fat || 'N/A'}g\n\n`;
                            });
                        }

                        responseContent += `**Total Nutrition**:\n`;
                        responseContent += `• Calories: ${foodAnalysis.total_nutrition?.calories || 'N/A'}\n`;
                        responseContent += `• Protein: ${foodAnalysis.total_nutrition?.protein || 'N/A'}g\n`;
                        responseContent += `• Carbs: ${foodAnalysis.total_nutrition?.carbohydrates || 'N/A'}g\n`;
                        responseContent += `• Fat: ${foodAnalysis.total_nutrition?.fat || 'N/A'}g\n`;
                    }

                    // Add OCR text if available and cleaned
                    if (response.data.cleaned_ocr_text) {
                        responseContent += `\n\n**Additional Information**:\n${response.data.cleaned_ocr_text}`;
                    }
                } else {
                    responseContent = `Sorry, I couldn't analyze this food image. ${response.data.message || ''}`;
                }

                // Add bot response
                const botMessage = {
                    type: 'bot' as const,
                    content: responseContent,
                    timestamp: new Date().toLocaleTimeString()
                };

                setMessages(prev => [...prev, botMessage]);

            } catch (error: any) {
                console.error('Food image processing error:', error);

                // More detailed error logging
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error('Error response data:', error.response.data);
                    console.error('Error response status:', error.response.status);
                    console.error('Error response headers:', error.response.headers);
                    console.error('Request URL:', error.config?.url);
                    console.error('Request method:', error.config?.method);

                    const errorMessage = {
                        type: 'bot' as const,
                        content: `Sorry, I encountered an error processing your food image (${error.response.status}): ${error.response.data.message || 'Unknown error'}. Please try again with a different image.`,
                        timestamp: new Date().toLocaleTimeString()
                    };
                    setMessages(prev => [...prev, errorMessage]);
                } else if (error.request) {
                    // The request was made but no response was received
                    console.error('Error request:', error.request);
                    const errorMessage = {
                        type: 'bot' as const,
                        content: 'Sorry, I couldn\'t reach the server to process your food image. Please check your internet connection and try again.',
                        timestamp: new Date().toLocaleTimeString()
                    };
                    setMessages(prev => [...prev, errorMessage]);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error('Error message:', error.message);
                    const errorMessage = {
                        type: 'bot' as const,
                        content: 'Sorry, I encountered an error processing your food image. Please try again.',
                        timestamp: new Date().toLocaleTimeString()
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
            } finally {
                setImageUploading(false);

                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };

        reader.readAsDataURL(file);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const headerElement = e.target as HTMLElement;
        if (headerElement.closest(`.${styles.chatHeader}`)) {
            setIsDragging(true);
            dragRef.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y
            };
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && dragRef.current) {
            const newX = e.clientX - dragRef.current.x;
            const newY = e.clientY - dragRef.current.y;

            // Ensure the chat stays within viewport bounds
            const maxX = window.innerWidth - dimensions.width;
            const maxY = window.innerHeight - dimensions.height;

            setPosition({
                x: Math.min(Math.max(0, newX), maxX),
                y: Math.min(Math.max(0, newY), maxY)
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        dragRef.current = null;
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleResizeMouseDown = (e: React.MouseEvent, type: 'horizontal' | 'vertical') => {
        setIsResizing(true);
        setResizeType(type);
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startWidth: dimensions.width,
            startHeight: dimensions.height
        };
    };

    const handleResizeMouseMove = (e: MouseEvent) => {
        if (isResizing && resizeRef.current) {
            if (resizeType === 'horizontal') {
                const deltaX = resizeRef.current.startX - e.clientX;
                const newWidth = Math.min(
                    Math.max(300, resizeRef.current.startWidth + deltaX),
                    position.x + dimensions.width
                );

                const widthDifference = newWidth - dimensions.width;
                const newX = position.x - widthDifference;

                setDimensions(prev => ({
                    ...prev,
                    width: newWidth
                }));
                setPosition(prev => ({
                    ...prev,
                    x: newX
                }));
            } else if (resizeType === 'vertical') {
                const deltaY = resizeRef.current.startY - e.clientY;
                const newHeight = Math.min(
                    Math.max(400, resizeRef.current.startHeight + deltaY),
                    position.y + dimensions.height
                );

                const heightDifference = newHeight - dimensions.height;
                const newY = position.y - heightDifference;

                setDimensions(prev => ({
                    ...prev,
                    height: newHeight
                }));
                setPosition(prev => ({
                    ...prev,
                    y: newY
                }));
            }
        }
    };

    const handleResizeMouseUp = () => {
        setIsResizing(false);
        resizeRef.current = null;
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMouseMove);
            window.addEventListener('mouseup', handleResizeMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleResizeMouseMove);
            window.removeEventListener('mouseup', handleResizeMouseUp);
        };
    }, [isResizing]);

    const handleExportJSON = (messages: Message[]) => {
        const chatHistory = {
            timestamp: new Date().toISOString(),
            conversation: messages.map(msg => ({
                role: msg.type,
                content: msg.content,
                timestamp: msg.timestamp,
                isImage: msg.isImage || false
            }))
        };

        const blob = new Blob([JSON.stringify(chatHistory, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = (messages: Message[]) => {
        const doc = new jsPDF();
        let yPos = 20;

        doc.setFontSize(16);
        doc.text('AI Fitness Coach - Chat History', 20, yPos);
        doc.setFontSize(12);

        messages.forEach((msg) => {
            yPos += 15;
            if (yPos >= 280) {  // Check if we need a new page
                doc.addPage();
                yPos = 20;
            }
            const role = msg.type === 'user' ? 'You' : 'Coach';
            const timestamp = msg.timestamp;
            doc.text(`${role} (${timestamp}):`, 20, yPos);

            // Word wrap the content
            const splitContent = doc.splitTextToSize(msg.content, 170);
            splitContent.forEach((line: string) => {
                yPos += 10;
                if (yPos >= 280) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 20, yPos);
            });
        });

        doc.save(`fitness-chat-${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className={styles.chatWidget}>
            {isOpen ? (
                <div
                    className={styles.chatContainer}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        width: dimensions.width,
                        height: dimensions.height,
                        position: 'fixed',
                        top: 0,
                        left: 0,
                    }}
                >
                    <div
                        className={styles.resizeHandleLeft}
                        onMouseDown={(e) => handleResizeMouseDown(e, 'horizontal')}
                    />
                    <div
                        className={styles.resizeHandleTop}
                        onMouseDown={(e) => handleResizeMouseDown(e, 'vertical')}
                    />
                    <div
                        className={styles.chatHeader}
                        onMouseDown={handleMouseDown}
                    >
                        <button
                            onClick={() => setIsOpen(false)}
                            className={styles.minimizeButton}
                        >
                            −
                        </button>
                        <span className={styles.headerTitle}>AI Fitness Coach</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className={styles.closeButton}
                        >
                            ×
                        </button>
                    </div>
                    <div className={styles.messageList}>
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`${styles.message} ${message.type === 'user' ? styles.userMessage : styles.botMessage}`}
                            >
                                <div className={styles.messageContent} style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                                    {message.isImage && message.imageData && (
                                        <div className={styles.imagePreview}>
                                            <img
                                                src={message.imageData}
                                                alt="Food"
                                                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                                            />
                                        </div>
                                    )}
                                    {message.content}
                                    <div className={styles.timestamp}>
                                        {message.timestamp}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className={styles.chatFooter}>
                        <div className={styles.exportOptions}>
                            <button onClick={() => handleExportJSON(messages)} className={styles.exportButton}>
                                View as JSON
                            </button>
                            <button onClick={() => handleExportPDF(messages)} className={styles.exportButton}>
                                Download PDF
                            </button>
                            <button
                                onClick={() => window.open(`${API_PATHS.CHAT}/chat/history/${conversationId}?format=json&pretty=true`, '_blank')}
                                className={styles.exportButton}
                            >
                                View Chat History
                            </button>
                        </div>
                    </div>
                    <div className={styles.inputContainer}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type your message here..."
                            disabled={loading || imageUploading}
                            className={styles.input}
                        />
                        <button
                            onClick={handleImageUpload}
                            disabled={loading || imageUploading}
                            className={styles.nutritionButton}
                            title="Upload food image for nutrition analysis"
                        >
                            Analyze Food 🍔
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || imageUploading}
                            className={styles.sendButton}
                        >
                            Send
                        </button>
                    </div>
                    {(loading || imageUploading) && (
                        <div className={styles.loadingIndicator}>
                            {imageUploading ? 'Analyzing food image...' : 'AI is thinking...'}
                        </div>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className={styles.chatButton}
                >
                    Chat
                </button>
            )}
        </div>
    );
};

export default Chat;