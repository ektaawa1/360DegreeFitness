import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Divider, Tag, Select, Typography } from "antd";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import axiosInstance from "./api/mock";
import moment, { Moment } from "moment";
import { DateRangeOption, DashboardState } from "./types";

const { Title } = Typography;
const { Option } = Select;

// Azia-Fuchsian and Aquamarine Blue color palette
const COLORS = {
    primary: "#E83D84",    // Azia-Fuchsian
    secondary: "#7FFFD4",  // Aquamarine
    accent: "#5B6C8D",     // Muted blue for balance
    success: "#6C8D7D",
    warning: "#8D7D6C",
    text: "#2D3748",       // Dark gray for text
    background: "#FFFFFF", // Pure white background
    cardBackground: "#FFFFFF",
    border: "#E2E8F0",     // Light gray border
};

const FitnessDashboard: React.FC = () => {
    const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("1W");
    const [state, setState] = useState<DashboardState>({
        nutrition: null,
        exercise: null,
        weight: null,
        loading: false,
    });

    // Get date range based on selection
    const getDateRange = (option: DateRangeOption): [Moment, Moment] => {
        const now = moment();
        switch (option) {
            case "1W": return [now.clone().subtract(1, "weeks"), now];
            case "1M": return [now.clone().subtract(1, "months"), now];
            case "3M": return [now.clone().subtract(3, "months"), now];
            case "6M": return [now.clone().subtract(6, "months"), now];
            case "1Y": return [now.clone().subtract(1, "years"), now];
            default: return [now.clone().subtract(1, "weeks"), now];
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRangeOption]);

    const fetchData = async () => {
        setState((prev) => ({ ...prev, loading: true }));
        try {
            const [nutritionRes, exerciseRes, weightRes] = await Promise.all([
                axiosInstance.get("/api/dash/nutrition"),
                axiosInstance.get("/api/dash/exercise"),
                axiosInstance.get("/api/dash/weight"),
            ]);
            setState({
                nutrition: nutritionRes.data,
                exercise: exerciseRes.data,
                weight: weightRes.data,
                loading: false,
            });
        } catch (error) {
            console.error("Error fetching data:", error);
            setState((prev) => ({ ...prev, loading: false }));
        }
    };

    // Chart options with new color scheme
    const getCaloriesChartOptions = (): Highcharts.Options => ({
        chart: {
            type: "column",
            backgroundColor: COLORS.cardBackground,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
        },
        title: {
            text: "Daily Calorie Intake",
            style: { color: COLORS.text, fontWeight: "500" }
        },
        xAxis: {
            categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            lineColor: COLORS.border,
            labels: { style: { color: COLORS.text } }
        },
        yAxis: {
            title: { text: "Calories", style: { color: COLORS.text } },
            gridLineColor: COLORS.border,
            labels: { style: { color: COLORS.text } }
        },
        plotOptions: {
            column: {
                borderRadius: 4,
                borderWidth: 0,
            }
        },
        series: [{
            name: "Calories",
            type: "column",
            data: state.nutrition?.dailyCalories || [],
            color: COLORS.primary, // Fuchsian for columns
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
            style: { color: COLORS.text, fontWeight: "500" }
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
                { name: "Protein", y: state.nutrition?.macros.protein || 0, color: COLORS.secondary }, // Aquamarine
                { name: "Carbs", y: state.nutrition?.macros.carbs || 0, color: "#FFA07A" }, // Light salmon for contrast
                { name: "Fat", y: state.nutrition?.macros.fat || 0, color: COLORS.primary }, // Fuchsian
            ],
        }],
    });

    const getWeightChartOptions = (): Highcharts.Options => ({
        chart: {
            type: "line",
            backgroundColor: COLORS.cardBackground,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
        },
        title: {
            text: "Weight Progress (kg)",
            style: { color: COLORS.text, fontWeight: "500" }
        },
        xAxis: {
            categories: ["Week 1", "Week 2", "Week 3", "Week 4"],
            lineColor: COLORS.border,
            labels: { style: { color: COLORS.text } }
        },
        yAxis: {
            title: { text: "Weight (kg)", style: { color: COLORS.text } },
            gridLineColor: COLORS.border,
            labels: { style: { color: COLORS.text } }
        },
        series: [
            {
                name: "Current",
                type: "line",
                data: state.weight?.trend || [],
                color: COLORS.primary, // Fuchsian
                lineWidth: 3,
                marker: { symbol: "circle", radius: 6, fillColor: COLORS.primary }
            },
            {
                name: "Goal",
                type: "line",
                data: Array(4).fill(state.weight?.goal || 0),
                dashStyle: "Dot",
                color: COLORS.secondary, // Aquamarine
                lineWidth: 2,
                marker: { enabled: false }
            },
        ],
    });

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
            style: { color: COLORS.text, fontWeight: "500" }
        },
        xAxis: {
            categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            lineColor: COLORS.border,
            labels: { style: { color: COLORS.text } }
        },
        yAxis: {
            title: { text: "Calories", style: { color: COLORS.text } },
            gridLineColor: COLORS.border,
            labels: { style: { color: COLORS.text } }
        },
        plotOptions: {
            column: {
                borderRadius: 4,
                borderWidth: 0,
            }
        },
        series: [{
            name: "Calories Burned",
            type: "column",
            data: state.exercise?.caloriesBurned || [],
            color: COLORS.secondary, // Aquamarine for exercise
        }],
    });

    const avgCalories = state.nutrition
        ? Math.round(state.nutrition.dailyCalories.reduce((a, b) => a + b, 0) / 7)
        : 0;

    // @ts-ignore
    return (
        <div style={{
            padding: "24px",
            backgroundColor: COLORS.background,
            minHeight: "100vh"
        }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
                <Card
                    loading={state.loading}
                    style={{
                        borderRadius: "12px",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                        border: `1px solid ${COLORS.border}`,
                        backgroundColor: COLORS.cardBackground,
                    }}
                    bodyStyle={{ padding: "24px" }}
                >
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px"
                    }}>
                        <Title level={3} style={{
                            margin: 0,
                            color: COLORS.primary, // Fuchsian for title
                            fontWeight: 600,
                            letterSpacing: "-0.5px"
                        }}>
                            FITNESS DASHBOARD
                        </Title>
                        <Select
                            value={dateRangeOption}
                            onChange={(value: DateRangeOption) => setDateRangeOption(value)}
                            style={{ width: "140px" }}
                            dropdownStyle={{
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: "8px"
                            }}
                        >
                            <Option value="1W">Last Week</Option>
                            <Option value="1M">Last Month</Option>
                            <Option value="3M">Last 3 Months</Option>
                            <Option value="6M">Last 6 Months</Option>
                            <Option value="1Y">Last Year</Option>
                        </Select>
                    </div>

                    {/* Summary Stats */}
                    <Row gutter={16} style={{ marginBottom: "24px" }}>
                        {[
                            { title: "Avg. Daily Calories", value: avgCalories, suffix: "kcal", color: COLORS.primary },
                            { title: "Workouts", value: state.exercise?.weeklyWorkouts.reduce((a, b) => a + b, 0) || 0, color: COLORS.secondary },
                            { title: "Current Weight", value: state.weight?.trend[state.weight.trend.length - 1] || 0, suffix: "kg", color: COLORS.accent },
                            { title: "Goal Weight", value: state.weight?.goal || 0, suffix: "kg", color: COLORS.primary },
                        ].map((stat, index) => (
                            <Col span={6} key={index}>
                                <Card
                                    bordered={true}
                                    style={{
                                        borderRadius: "8px",
                                        border: `1px solid ${COLORS.border}`,
                                        backgroundColor: COLORS.cardBackground,
                                    }}
                                    bodyStyle={{ padding: "16px" }}
                                >
                                    <Statistic
                                        title={<span style={{ color: COLORS.text, fontSize: "14px" }}>{stat.title}</span>}
                                        value={stat.value}
                                        suffix={stat.suffix}
                                        valueStyle={{
                                            color: stat.color,
                                            fontWeight: 600,
                                            fontSize: "24px"
                                        }}
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Charts Section */}
                    <Row gutter={16} style={{ marginBottom: "24px" }}>
                        <Col span={12}>
                            <Card
                                bordered={true}
                                style={{
                                    borderRadius: "12px",
                                    border: `1px solid ${COLORS.border}`,
                                    backgroundColor: COLORS.cardBackground,
                                }}
                                bodyStyle={{ padding: "16px" }}
                            >
                                <HighchartsReact highcharts={Highcharts} options={getCaloriesChartOptions()} />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card
                                bordered={true}
                                style={{
                                    borderRadius: "12px",
                                    border: `1px solid ${COLORS.border}`,
                                    backgroundColor: COLORS.cardBackground,
                                }}
                                bodyStyle={{ padding: "16px" }}
                            >
                                <HighchartsReact highcharts={Highcharts} options={getMacrosChartOptions()} />
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={16} style={{ marginBottom: "24px" }}>
                        <Col span={12}>
                            <Card
                                bordered={true}
                                style={{
                                    borderRadius: "12px",
                                    border: `1px solid ${COLORS.border}`,
                                    backgroundColor: COLORS.cardBackground,
                                }}
                                bodyStyle={{ padding: "16px" }}
                            >
                                <HighchartsReact highcharts={Highcharts} options={getWeightChartOptions()} />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card
                                bordered={true}
                                style={{
                                    borderRadius: "12px",
                                    border: `1px solid ${COLORS.border}`,
                                    backgroundColor: COLORS.cardBackground,
                                }}
                                bodyStyle={{ padding: "16px" }}
                            >
                                <HighchartsReact highcharts={Highcharts} options={getExerciseChartOptions()} />
                            </Card>
                        </Col>
                    </Row>

                    {/* Recent Activity */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Card
                                title={<span style={{ color: COLORS.primary }}>Recent Meals</span>}
                                bordered={true}
                                style={{
                                    borderRadius: "12px",
                                    border: `1px solid ${COLORS.border}`,
                                    backgroundColor: COLORS.cardBackground,
                                }}
                                headStyle={{ borderBottom: `1px solid ${COLORS.border}` }}
                            >
                                {state.nutrition?.meals.map((meal, i) => (
                                    <div key={i} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        marginBottom: "12px",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        backgroundColor: i % 2 === 0 ? "rgba(232, 61, 132, 0.05)" : "transparent",
                                        borderLeft: `3px solid ${i % 2 === 0 ? COLORS.primary : "transparent"}`
                                    }}>
                                        <Tag
                                            color={COLORS.primary}
                                            style={{
                                                marginRight: "12px",
                                                fontWeight: 500
                                            }}
                                        >
                                            {meal.time}
                                        </Tag>
                                        <span style={{ flex: 1, color: COLORS.text, fontWeight: 500 }}>{meal.name}</span>
                                        <span style={{ color: COLORS.primary, fontWeight: 600 }}>{meal.calories} kcal</span>
                                    </div>
                                ))}
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card
                                title={<span style={{ color: COLORS.secondary }}>Recent Workouts</span>}
                                bordered={true}
                                style={{
                                    borderRadius: "12px",
                                    border: `1px solid ${COLORS.border}`,
                                    backgroundColor: COLORS.cardBackground,
                                }}
                                headStyle={{ borderBottom: `1px solid ${COLORS.border}` }}
                            >
                                {state.exercise?.lastWorkouts.map((workout, i) => (
                                    <div key={i} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        marginBottom: "12px",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        backgroundColor: i % 2 === 0 ? "rgba(127, 255, 212, 0.05)" : "transparent",
                                        borderLeft: `3px solid ${i % 2 === 0 ? COLORS.secondary : "transparent"}`
                                    }}>
                                        <Tag
                                            color={COLORS.secondary}
                                            style={{
                                                marginRight: "12px",
                                                color: "#2D3748",
                                                fontWeight: 500
                                            }}
                                        >
                                            {workout.type}
                                        </Tag>
                                        <span style={{ flex: 1, color: COLORS.text, fontWeight: 500 }}>{workout.duration} min</span>
                                        <span style={{ color: COLORS.secondary, fontWeight: 600 }}>{workout.calories} kcal</span>
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