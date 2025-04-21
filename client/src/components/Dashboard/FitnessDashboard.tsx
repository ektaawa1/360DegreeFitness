import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Tag, Typography } from "antd";
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
    border: "#BCAAA4",        // Light stone border
    stoneLight: "#D7CCC8",    // Lighter stone
    stoneDark: "#ccb22b",     // Darker stone
};

const FitnessDashboard: React.FC = () => {
    const [state, setState] = useState<DashboardState>({
        nutrition: null,
        exercise: null,
        weightData: null,
        targetWeight: null,
        loading: false,
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
            });
        } catch (error) {
            console.error("Error fetching data:", error);
            setState((prev) => ({ ...prev, loading: false }));
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
            categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            lineColor: COLORS.border,
            labels: {
                style: {
                    color: COLORS.text,
                    fontWeight: "500"
                }
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
                colors: [
                    COLORS.primary,
                    COLORS.secondary,
                    COLORS.accent,
                    COLORS.primary,
                    COLORS.secondary,
                    COLORS.accent,
                    COLORS.primary
                ]
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
            data: [
                { name: "Protein", y: state.nutrition?.macros.protein || 0, color: COLORS.primary },
                { name: "Carbs", y: state.nutrition?.macros.carbs || 0, color: COLORS.secondary },
                { name: "Fat", y: state.nutrition?.macros.fat || 0, color: COLORS.accent },
            ],
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
            title: { text: "Weight Progress" },
            xAxis: {
                categories: [...weightLogs.map(entry => entry.date), today],
                title: { text: "Date" },
                min: 0,
                max: weightLogs.length,
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
                    if (this.series.name === "Projected Weight") {
                        return `<b>Date:</b> ${today}<br><b>Projected Weight:</b> ${lastLog} kg`;
                    } else if (this.series.name === "Target Weight") {
                        return `<b>Target Weight:</b> ${targetWeight} kg`;
                    } else if (this.series.name === "Weight") {
                        if (this.point.x === -0.5) return `<b>Start</b><br><b>Weight:</b> ${weightData.starting_weight} kg`;
                        const log = weightLogs[this.point.x];
                        return `<b>Date:</b> ${log.date}<br><b>Weight:</b> ${log.weight_in_kg} kg` +
                            (log.notes ? `<br><b>Notes:</b> ${log.notes}` : "");
                    }
                }
            },
            series: [
                {
                    name: "Weight",
                    data: [
                        { x: -0.5, y: weightData.starting_weight },
                        ...weightLogs.map((entry, index) => ({ x: index, y: entry.weight_in_kg }))
                    ],
                    marker: { enabled: true },
                    lineWidth: 2
                },
                {
                    name: "Target Weight", // Horizontal target line
                    data: [
                        { x: -0.5, y: targetWeight },
                        { x: weightLogs.length, y: targetWeight }
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
                        { x: weightLogs.length - 1, y: lastLog },
                        { x: weightLogs.length, y: lastLog }
                    ],
                    dashStyle: "dot",
                    color: "gray",
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
            categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            lineColor: COLORS.border,
            labels: {
                style: {
                    color: COLORS.text,
                    fontWeight: "500"
                }
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
                colors: [
                    COLORS.secondary,
                    COLORS.primary,
                    COLORS.secondary,
                    COLORS.primary,
                    COLORS.secondary,
                    COLORS.primary,
                    COLORS.secondary
                ]
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
                                <HighchartsReact highcharts={Highcharts} options={getCaloriesChartOptions()} />
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
                                <HighchartsReact highcharts={Highcharts} options={getMacrosChartOptions()} />
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
                                <HighchartsReact highcharts={Highcharts} options={getExerciseChartOptions()} />
                            </Card>
                        </Col>
                    </Row>

                    {/* Recent Activity */}
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Card
                                title={<span style={{
                                    color: COLORS.primary,
                                    fontWeight: 500,
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
                                {state.nutrition?.meals.map((meal, i) => (
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
                                            {meal.time}
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
                                ))}
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card
                                title={<span style={{
                                    color: COLORS.secondary,
                                    fontWeight: 500,
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
                                {state.exercise?.lastWorkouts.map((workout, i) => (
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
                                ))}
                            </Card>
                        </Col>
                    </Row>
                </Card>
            </div>
        </div>
    );
};

export default FitnessDashboard;