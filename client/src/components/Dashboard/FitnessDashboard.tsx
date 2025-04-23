import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Tag, Typography, Empty } from "antd";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import axiosInstance from "./api/mock";
import { DashboardState } from "./types";
import Axios from "axios";
import {BASE_URL} from "../../config/Config";

const { Title } = Typography;

const COLORS = {
    primary: "#b173a0",       // Deep purple
    secondary: "#31a1b3",     // Pink
    accent: "#E91E63",        // Nuriel stone
    success: "#4CAF50",
    warning: "#FF9800",
    text: "#3E2723",          // Dark brown
    background: "#EFEBE9",    // Light stone
    cardBackground: "#FFFFFF",

    border: "#D8E1E8",                        // Light blue-gray border
    stoneLight: "#E6ECF2",                    // Very light blue
    stoneDark: "#5D8AA8",                     // Steel blue
    chartColors: [
        "rgba(88, 143, 182, 0.8)",           // Primary blue
        "rgba(122, 197, 205, 0.8)",          // Aqua
        "rgba(158, 218, 229, 0.8)",          // Light blue
        "rgba(100, 179, 124, 0.8)",          // Green
        "rgba(244, 177, 131, 0.8)",          // Peach
        "rgba(177, 162, 202, 0.8)",          // Lavender
        "rgba(255, 157, 166, 0.8)"           // Soft pink
    ]
};

// Polish-style no data component
const PolishNoData = ({ height, message = "No data to display" }) => (
    <div style={{
        height,
        textAlign: 'center',
        padding: '40px 20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: `2px dashed ${COLORS.border}`
    }}>
        <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            color: COLORS.primary
        }}>
            🎨
        </div>
        <Title level={4} style={{
            color: COLORS.text,
            fontFamily: "'Playfair Display', serif",
            marginBottom: '8px'
        }}>
            {message}
        </Title>
        <p style={{
            color: COLORS.stoneDark,
            fontStyle: 'italic',
            marginBottom: '0'
        }}>
            Add data to see charts and statistics
        </p>
    </div>
);

const FitnessDashboard: React.FC = () => {
    const [state, setState] = useState<DashboardState>({
        nutrition: null,
        exercise: null,
        weightData: null,
        targetWeight: null,
        loading: false,
        hasError: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setState((prev) => ({ ...prev, loading: true }));
        const token = sessionStorage.getItem("auth-token");
        const headers = { "x-auth-token": token };
        try {
            const [nutritionRes, exerciseRes, weightRes, goalResponse] = await Promise.all([
                axiosInstance.get("/api/dash/nutrition"),
                axiosInstance.get("/api/dash/exercise"),
                Axios.get(`${BASE_URL}/api/weight/get_weight?range=3m`, { headers }),
                Axios.get(`${BASE_URL}/api/profile/get-weight-goal`, { headers })
            ]);
            let updatedData = weightRes.data || {};
            updatedData.weight_logs = preprocessWeightLogs(updatedData.weight_logs || []);
            setState({
                nutrition: nutritionRes.data,
                exercise: exerciseRes.data,
                weightData: updatedData,
                targetWeight: goalResponse.data.weight_goal_in_kg,
                loading: false,
                hasError: false
            });
        } catch (error) {
            console.error("Error fetching data:", error);
            setState((prev) => ({ ...prev, loading: false, hasError: true }));
        }
    };

    // Function to preprocess weight logs and assign an index for each entry on the same date
    const preprocessWeightLogs = (weightLogs) => {
        let processedLogs = [];
        let dateEntryMap = {};

        weightLogs.forEach((entry) => {
            if (!dateEntryMap[entry.date]) {
                dateEntryMap[entry.date] = 0;
            }
            processedLogs.push({ ...entry, entryIndex: dateEntryMap[entry.date] });
            dateEntryMap[entry.date] += 1;
        });

        return processedLogs;
    };

    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).replace(' ', '-'));
        }
        return days;
    };

    const renderChartOrPlaceholder = (chartOptions: Highcharts.Options, dataCheck: any, customMessage?: string, height?: number) => {
        if (state.loading) return null;
        if (state.hasError) {
            return <PolishNoData message="An error occurred while loading data!!" height={height}/>;
        }
        if (!dataCheck) {
            return <PolishNoData message={customMessage} height={height}/>;
        }
        return <HighchartsReact highcharts={Highcharts} options={chartOptions} />;
    };


    // Chart options with new color scheme
    const getCaloriesChartOptions = (): Highcharts.Options => ({
        chart: {
            type: "column",
            backgroundColor: COLORS.cardBackground,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
            style: {
                fontFamily: "'Roboto', sans-serif"
            }
        },
        title: {
            text: "Daily Calorie Intake",
            style: {
                color: COLORS.text,
                fontWeight: "500",
                fontSize: "16px"
            }
        },
        xAxis: {
            categories: getLast7Days(),
            lineColor: COLORS.border,
            labels: {
                style: {
                    color: COLORS.text,
                    fontWeight: "500"
                },
                autoRotation: [-45], // Only rotate if needed
                rotation: 0 // Default to horizontal
            }
        },
        yAxis: {
            title: {
                text: "Calories",
                style: {
                    color: COLORS.text,
                    fontWeight: "500"
                }
            },
            gridLineColor: COLORS.stoneLight,
            labels: {
                style: {
                    color: COLORS.text,
                    fontWeight: "500"
                }
            }
        },
        plotOptions: {
            column: {
                borderRadius: 4,
                borderWidth: 0,
                colorByPoint: true,
                colors: COLORS.chartColors
            }
        },
        series: [{
            name: "Calories",
            type: "column",
            data: state.nutrition?.dailyCalories || [],
        }],
    });

    const getMacrosChartOptions = (): Highcharts.Options => ({
        chart: {
            type: "pie",
            backgroundColor: COLORS.cardBackground,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
        },
        title: {
            text: "Macronutrient Breakdown",
            style: {
                color: COLORS.text,
                fontWeight: "500",
                fontSize: "16px"
            }
        },
        plotOptions: {
            pie: {
                borderWidth: 0,
                dataLabels: {
                    style: {
                        color: COLORS.text,
                        textOutline: "none",
                        fontWeight: "500"
                    }
                }
            }
        },
        series: [{
            name: "Macros (g)",
            type: "pie",
            data: state.nutrition?.macros.carbs ? [
                { name: "Protein", y: state.nutrition?.macros.protein || 0, color: COLORS.chartColors[0] },
                { name: "Carbs", y: state.nutrition?.macros.carbs || 0, color: COLORS.chartColors[3] },
                { name: "Fat", y: state.nutrition?.macros.fat || 0, color: COLORS.chartColors[6] },
            ]: [],
        }],
    });

    const getCurrentWeight = () => {
        const weightData = state.weightData;
        if (!weightData) {
            return 0;
        }

// Calculate y-axis min/max to include starting_weight, target_weight, and logged weights
        const weightLogs = weightData.weight_logs;
        let lastLog = weightLogs[weightLogs.length - 1]?.weight_in_kg;
        if (!lastLog) {
            lastLog = weightData.starting_weight;
        }
 return lastLog;
    }

    const getWeightChartOptions = () => {

        const weightData = state.weightData;
        if (!weightData){
            return {};
        }
        const targetWeight = state.targetWeight;

// Calculate y-axis min/max to include starting_weight, target_weight, and logged weights
        const today = new Date().toISOString().split("T")[0];
        const weightLogs = weightData.weight_logs;
        let lastLog = weightLogs[weightLogs.length - 1]?.weight_in_kg;
        if (!lastLog) {
            lastLog = weightData.starting_weight;
        }



        const allWeights = [
            weightData.starting_weight,
            targetWeight,
            ...weightLogs.map(entry => entry.weight_in_kg)
        ];
        const minWeight = Math.min(...allWeights) - 0.5; // Add padding
        const maxWeight = Math.max(...allWeights) + 0.5;

        const weightChartOptions = {
            chart: { type: "line" },
            title: { text: "Weight Progress",style: {
                    color: COLORS.text,
                    fontWeight: "500",
                    fontSize: "16px"
                } },
            xAxis: {
                type: 'datetime',
                title: { text: "Date" },
                labels: {
                    format: '{value:%b-%d}', // Shows "Apr-21" format
                    autoRotation: [-45], // Only rotate if needed
                    rotation: 0, // Default to horizontal
                    style: {
                        color: COLORS.text,
                        fontWeight: "500"
                    }
                },
                min: weightLogs.length > 0 ? new Date(weightLogs[0].date).getTime() : null,
                max: new Date(today).getTime(),
            },
            yAxis: {
                title: { text: "Weight (kg)" },
                min: minWeight,
                max: maxWeight,
                allowDecimals: true,
                lineWidth: 1,
                lineColor: "#000",
                plotLines: [{ // Optional: Visual reference line for target
                    color: 'green',
                    width: 1,
                    value: targetWeight,
                    dashStyle: 'Dash',
                    label: {
                        text: `Target: ${targetWeight} kg`,
                        align: 'right',
                        style: { color: 'green' }
                    }
                }]
            },
            tooltip: {
                formatter: function() {
                    if (this.series.name === "Target Weight") {
                        return `<b>Target Weight:</b> ${targetWeight} kg`;
                    } else {
                        if (this.point.x === new Date(weightData.start_date).getTime()) {
                            return `<b>Start</b><br><b>Weight:</b> ${weightData.starting_weight} kg`;
                        }
                        const dateStr = Highcharts.dateFormat('%b %e, %Y', new Date(this.point.x));
                        return `<b>Date:</b> ${dateStr}<br><b>Weight:</b> ${this.point.y} kg` +
                            (this.point.notes ? `<br><b>Notes:</b> ${this.point.notes}` : "");
                    }
                }
            },
            series: [
                {
                    name: "Weight",
                    data: [
                        { x: new Date(weightData.start_date).getTime(), y: weightData.starting_weight },
                        ...weightLogs.map(entry => ({
                            x: new Date(entry.date).getTime(),
                            y: entry.weight_in_kg
                        }))
                    ],
                    marker: { enabled: true },
                    lineWidth: 2
                },
                {
                    name: "Target Weight",
                    data: [
                        { x: new Date(weightData.start_date).getTime(), y: targetWeight },
                        { x: new Date(today).getTime(), y: targetWeight }
                    ],
                    color: "green",
                    dashStyle: "Dash",
                    marker: { enabled: false },
                    lineWidth: 3,
                    enableMouseTracking: true // Allows tooltips
                },
                {
                    name: "Projected Weight",
                    data: [
                        { x: weightLogs.length > 0 ? new Date(weightLogs[weightLogs.length-1].date).getTime() : new Date(weightData.start_date).getTime(),
                            y: lastLog },
                        { x: new Date(today).getTime(), y: lastLog }
                    ],
                    dashStyle: "dot",
                    color: "red",
                    marker: { enabled: true }
                }
            ]
        };
        return weightChartOptions;
    }



    const getExerciseChartOptions = (): Highcharts.Options => ({
        chart: {
            type: "column",
            backgroundColor: COLORS.cardBackground,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
        },
        title: {
            text: "Calories Burned",
            style: {
                color: COLORS.text,
                fontWeight: "500",
                fontSize: "16px"
            }
        },
        xAxis: {
            categories: getLast7Days(),
            lineColor: COLORS.border,
            labels: {
                style: {
                    color: COLORS.text,
                    fontWeight: "500"
                },
                autoRotation: [-45], // Only rotate if needed
                rotation: 0 // Default to horizontal
            }
        },
        yAxis: {
            title: {
                text: "Calories",
                style: {
                    color: COLORS.text,
                    fontWeight: "500"
                }
            },
            gridLineColor: COLORS.stoneLight,
            labels: {
                style: {
                    color: COLORS.text,
                    fontWeight: "500"
                }
            }
        },
        plotOptions: {
            column: {
                borderRadius: 4,
                borderWidth: 0,
                colorByPoint: true,
                colors: COLORS.chartColors.slice().reverse() // Use reversed colors for variety
            }
        },
        series: [{
            name: "Calories Burned",
            type: "column",
            data: state.exercise?.caloriesBurned || [],
        }],
    });

    const avgCalories = state.nutrition
        ? Math.round(state.nutrition.dailyCalories.reduce((a, b) => a + b, 0) / 7)
        : 0;

    return (
        <div style={{
            padding: "24px",
            backgroundColor: COLORS.background,
            minHeight: "100vh",
            backgroundImage: "linear-gradient(to bottom, #EFEBE9, #D7CCC8)"
        }}>
            <div style={{
                maxWidth: "1400px",
                margin: "0 auto",
            }}>
                <Card
                    loading={state.loading}
                    style={{
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                        border: `1px solid ${COLORS.border}`,
                        backgroundColor: COLORS.cardBackground,
                        backgroundImage: "linear-gradient(to right, #FFFFFF, #F5F5F5)"
                    }}
                    bodyStyle={{ padding: "24px" }}
                >
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        borderBottom: `1px solid ${COLORS.stoneLight}`,
                        paddingBottom: "16px"
                    }}>
                        <Title level={3} style={{
                            margin: 0,
                            color: COLORS.primary,
                            fontWeight: 600,
                            letterSpacing: "-0.5px",
                            textTransform: "uppercase",
                            fontFamily: "'Playfair Display', serif"
                        }}>
                            Fitness Dashboard
                        </Title>
                    </div>

                    {/* Summary Stats */}
                    <Row gutter={16} style={{ marginBottom: "24px" }}>
                        {[
                            {
                                title: "Avg. Daily Calories",
                                value: avgCalories,
                                suffix: "kcal",
                                color: COLORS.primary,
                                icon: "🔥"
                            },
                            {
                                title: "Workouts",
                                value: state.exercise?.weeklyWorkouts.reduce((a, b) => a + b, 0) || 0,
                                color: COLORS.secondary,
                                suffix: "mins",
                                icon: "💪"
                            },
                            {
                                title: "Current Weight",
                                value: getCurrentWeight(),
                                suffix: "kg",
                                color: COLORS.accent,
                                icon: "⚖️"
                            },
                            {
                                title: "Goal Weight",
                                value: state.targetWeight || 0,
                                suffix: "kg",
                                color: COLORS.primary,
                                icon: "🎯"
                            },
                        ].map((stat, index) => (
                            <Col xs={24} sm={12} md={6} key={index}>
                                <Card
                                    bordered={true}
                                    style={{
                                        borderRadius: "8px",
                                        border: `1px solid ${COLORS.border}`,
                                        backgroundColor: COLORS.cardBackground,
                                        height: "100%",
                                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                                    }}
                                    bodyStyle={{ padding: "16px" }}
                                >
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        marginBottom: "8px"
                                    }}>
                    <span style={{
                        fontSize: "24px",
                        marginRight: "8px",
                        color: stat.color
                    }}>
                      {stat.icon}
                    </span>
                                        <span style={{
                                            color: COLORS.text,
                                            fontSize: "14px",
                                            fontWeight: 500
                                        }}>
                      {stat.title}
                    </span>
                                    </div>
                                    <Statistic
                                        value={stat.value}
                                        suffix={stat.suffix}
                                        valueStyle={{
                                            color: stat.color,
                                            fontWeight: 600,
                                            fontSize: "24px",
                                            fontFamily: "'Roboto Condensed', sans-serif"
                                        }}
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Charts Section */}
                    <Row gutter={16} style={{ marginBottom: "24px" }}>
                        <Col xs={24} md={12}>
                            <Card
                                bordered={true}
                                style={{
                                    borderRadius: "12px",
                                    border: `1px solid ${COLORS.border}`,
                                    backgroundColor: COLORS.cardBackground,
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                                }}
                                bodyStyle={{ padding: "16px" }}
                            >
                                {renderChartOrPlaceholder(
                                    getCaloriesChartOptions(),
                                    state.nutrition?.dailyCalories?.length > 0,
                                    "No calorie data."
                                )}
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card
                                bordered={true}
                                style={{
                                    borderRadius: "12px",
                                    border: `1px solid ${COLORS.border}`,
                                    backgroundColor: COLORS.cardBackground,
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                                }}
                                bodyStyle={{ padding: "16px" }}
                            >
                                {renderChartOrPlaceholder(
                                    getMacrosChartOptions(),
                                    state.nutrition?.macros?.carbs,
                                    "No data on macronutrients."
                                )}
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={16} style={{ marginBottom: "24px" }}>
                        <Col xs={24} md={12}>
                            <Card
                                bordered={true}
                                style={{
                                    borderRadius: "12px",
                                    border: `1px solid ${COLORS.border}`,
                                    backgroundColor: COLORS.cardBackground,
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                                }}
                                bodyStyle={{ padding: "16px" }}
                            >
                                <HighchartsReact highcharts={Highcharts} options={getWeightChartOptions()} />
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card
                                bordered={true}
                                style={{
                                    borderRadius: "12px",
                                    border: `1px solid ${COLORS.border}`,
                                    backgroundColor: COLORS.cardBackground,
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                                }}
                                bodyStyle={{ padding: "16px" }}
                            >
                                {renderChartOrPlaceholder(
                                    getExerciseChartOptions(),
                                    state.exercise?.caloriesBurned?.length > 0,
                                    "No exercise data",
                                    400
                                )}
                            </Card>
                        </Col>
                    </Row>

                    {/* Recent Activity */}
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Card
                                title={<span style={{
                                    color: COLORS.primary,
                                    fontWeight: 600,
                                    fontFamily: "'Playfair Display', serif"
                                }}>Recent Meals</span>}
                                bordered={true}
                                style={{
                                    borderRadius: "12px",
                                    border: `1px solid ${COLORS.border}`,
                                    backgroundColor: COLORS.cardBackground,
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                                }}
                                headStyle={{
                                    borderBottom: `1px solid ${COLORS.stoneLight}`,
                                    padding: "0 16px"
                                }}
                                bodyStyle={{ padding: "16px" }}
                            >
                                {state.nutrition?.meals?.length > 0 ? (
                                    state.nutrition.meals.map((meal, i) => (
                                        <div key={i} style={{
                                            display: "flex",
                                            alignItems: "center",
                                            marginBottom: "12px",
                                            padding: "12px",
                                            borderRadius: "6px",
                                            backgroundColor: i % 2 === 0 ? "rgba(156, 39, 176, 0.05)" : "transparent",
                                            borderLeft: `3px solid ${i % 2 === 0 ? COLORS.primary : "transparent"}`,
                                            transition: "all 0.2s ease",
                                            ":hover": {
                                                backgroundColor: "rgba(233, 30, 99, 0.05)"
                                            }
                                        }}>
                                            <Tag
                                                color={COLORS.primary}
                                                style={{
                                                    marginRight: "12px",
                                                    fontWeight: 500,
                                                    borderRadius: "4px",
                                                    border: "none"
                                                }}
                                            >
                                                {meal.date}
                                            </Tag>
                                            <span style={{
                                                flex: 1,
                                                color: COLORS.text,
                                                fontWeight: 500,
                                                fontFamily: "'Roboto', sans-serif"
                                            }}>
                                                {meal.name}
                                            </span>
                                            <span style={{
                                                color: COLORS.primary,
                                                fontWeight: 600,
                                                fontFamily: "'Roboto Condensed', sans-serif"
                                            }}>
                                                {meal.calories} kcal
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <PolishNoData message="No recent meals" />
                                )}
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card
                                title={<span style={{
                                    color: COLORS.secondary,
                                    fontWeight: 600,
                                    fontFamily: "'Playfair Display', serif"
                                }}>Recent Workouts</span>}
                                bordered={true}
                                style={{
                                    borderRadius: "12px",
                                    border: `1px solid ${COLORS.border}`,
                                    backgroundColor: COLORS.cardBackground,
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                                }}
                                headStyle={{
                                    borderBottom: `1px solid ${COLORS.stoneLight}`,
                                    padding: "0 16px"
                                }}
                                bodyStyle={{ padding: "16px" }}
                            >
                                {state.exercise?.lastWorkouts?.length > 0 ? (
                                    state.exercise.lastWorkouts.map((workout, i) => (
                                        <div key={i} style={{
                                            display: "flex",
                                            alignItems: "center",
                                            marginBottom: "12px",
                                            padding: "12px",
                                            borderRadius: "6px",
                                            backgroundColor: i % 2 === 0 ? "rgba(233, 30, 99, 0.05)" : "transparent",
                                            borderLeft: `3px solid ${i % 2 === 0 ? COLORS.secondary : "transparent"}`,
                                            transition: "all 0.2s ease",
                                            ":hover": {
                                                backgroundColor: "rgba(156, 39, 176, 0.05)"
                                            }
                                        }}>
                                            <Tag
                                                color={COLORS.secondary}
                                                style={{
                                                    marginRight: "12px",
                                                    color: "#FFFFFF",
                                                    fontWeight: 500,
                                                    borderRadius: "4px",
                                                    border: "none"
                                                }}
                                            >
                                                {workout.type}
                                            </Tag>
                                            <span style={{
                                                flex: 1,
                                                color: COLORS.text,
                                                fontWeight: 500,
                                                fontFamily: "'Roboto', sans-serif"
                                            }}>
                                                {workout.duration} min
                                            </span>
                                            <span style={{
                                                color: COLORS.secondary,
                                                fontWeight: 600,
                                                fontFamily: "'Roboto Condensed', sans-serif"
                                            }}>
                                                {workout.calories} kcal
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <PolishNoData message="No recent training sessions" />
                                )}
                            </Card>
                        </Col>
                    </Row>
                </Card>
            </div>
        </div>
    );
};

export default FitnessDashboard;