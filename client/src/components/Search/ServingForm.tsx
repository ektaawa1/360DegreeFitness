import React from 'react';
import { Form, Select, DatePicker, InputNumber, Button } from 'antd';
import moment from 'moment';
import styles from "./Search.module.css";

const { Option } = Select;

const ServingFormEL = ({ form, foodData, onSubmit }) => {
    const { getFieldDecorator, validateFields } = form;

    const findServing = (servingType) => {
        for (const serving of foodData.servings.serving) {
            if (serving.serving_description === servingType) {
                return serving;
            }
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        validateFields((err, values) => {
            if (!err) {
                const serving = findServing(values.servingType);
                onSubmit({
                    meal_log_date: values.date.format('YYYY-MM-DD'),
                    meal_type: values.meal.toLowerCase(),
                    food_id: foodData.food_id,
                    food_name: foodData.food_name,
                    quantity_consumed: values.quantity,
                    food_description: values.servingType,
                    calories_per_serving: Number(serving.calories),
                    fat_per_serving: Number(serving.fat),
                    carbs_per_serving: Number(serving.carbohydrate),
                    protein_per_serving: Number(serving.protein),
                });
            }
        });
    };

    return (
        <Form layout="vertical" onSubmit={handleSubmit} className={styles.add_diary_form}>
            <Form.Item label="Date" style={{ padding: 0}}>
                {getFieldDecorator('date', {
                    initialValue: moment(),
                    rules: [{ required: true, message: 'Please select a date' }],
                })(<DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} allowClear={false} />)}
            </Form.Item>

            <Form.Item label="Meal" style={{ padding: 0}}>
                {getFieldDecorator('meal', {
                    initialValue: "Breakfast",
                    rules: [{ required: true, message: 'Please select a meal type' }],
                })(
                    <Select placeholder="Select meal">
                        <Option value="Breakfast">Breakfast</Option>
                        <Option value="Lunch">Lunch</Option>
                        <Option value="Snacks">Snacks</Option>
                        <Option value="Dinner">Dinner</Option>
                    </Select>
                )}
            </Form.Item>

            <Form.Item label="Serving Quantity" style={{ padding: 0}}>
                {getFieldDecorator('quantity', {
                    initialValue: 1,
                    rules: [{ required: true, message: 'Please enter quantity' }],
                })(<InputNumber min={0} step={0.1} style={{ width: '100%' }} />)}
            </Form.Item>

            <Form.Item label="Serving Type" style={{ padding: 0}}>
                {getFieldDecorator('servingType', {
                    rules: [{ required: true, message: 'Please select a serving type' }],
                })(
                    <Select placeholder="Select serving type">
                        {foodData?.servings?.serving.map((serving) => (
                            <Option key={serving.serving_id} value={serving.serving_description}>
                                {serving.serving_description}
                            </Option>
                        ))}
                    </Select>
                )}
            </Form.Item>

            <Form.Item style={{ padding: 0}}>
                <Button type="primary" htmlType="submit">Add to Diary</Button>
            </Form.Item>
        </Form>
    );
};

const ServingForm = Form.create({ name: 'add_to_diary_form' })(ServingFormEL);
export default ServingForm;
