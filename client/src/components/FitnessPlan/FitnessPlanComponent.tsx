import React, { useState, useEffect } from 'react';
import { Card, Tabs, List, Typography } from 'antd';
import axios from 'axios';
import {BASE_URL} from "../../config/Config";
import Axios from "axios";

const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface FitnessPlan {
    fitness_plan: {
        user_id: string;
        plan_duration: string;
        meal_plan: Record<string, Record<string, string>>;
        workout_plan: Record<string, string>;
        sleep_and_lifestyle_suggestions: {
            sleep_duration: string;
            sleep_tips: string;
            stress_management: string;
        };
        goals: {
            total_calories_goal: number;
            total_fat_goal: number;
            total_carbs_goal: number;
            total_protein_goal: number;
        };
    };
}

const FitnessPlanComponent: React.FC = () => {
    const [fitnessData, setFitnessData] = useState<FitnessPlan | null>(null);

    useEffect(() => {
        let token = sessionStorage.getItem("auth-token");
        const headers = {"x-auth-token": token};
        const url = BASE_URL + `/api/profile/get-fitness-plan`;
        axios.get(url, {headers}).then((response) => {
            console.log(response);
            setFitnessData(response.data);
        });
    }, []);

    if (!fitnessData) {
        return <Text>Loading fitness plan...</Text>;
    }

    const { meal_plan, workout_plan, sleep_and_lifestyle_suggestions, goals } = fitnessData.fitness_plan;

    return (
        <Card title="Your Personalized Fitness Plan" className="fitness-card">
            <div className="tabs-container">
                <Tabs defaultActiveKey="1" centered>
                    <TabPane tab="Meal Plan" key="1">
                        <div className="scroll-content">
                            {Object.keys(meal_plan).map((day) => (
                                <Card key={day} title={day.replace('_', ' ').toUpperCase()} className="day-card">
                                    <List
                                        bordered
                                        dataSource={Object.entries(meal_plan[day])}
                                        renderItem={([meal, description]) => (
                                            <List.Item>
                                                <Text strong className="meal-header">{meal.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}:</Text> {description}
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            ))}
                        </div>
                    </TabPane>

                    <TabPane tab="Workout Plan" key="2">
                        <div className="scroll-content">
                            <List
                                bordered
                                dataSource={Object.entries(workout_plan)}
                                renderItem={([day, workout]) => (
                                    <List.Item>
                                        <Text strong>{day.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}:</Text> {workout}
                                    </List.Item>
                                )}
                            />
                        </div>
                    </TabPane>

                    <TabPane tab="Lifestyle Tips" key="3">
                        <div className="scroll-content">
                            <Card>
                                <Title level={4}>Sleep & Lifestyle Suggestions</Title>
                                <Text><strong>Sleep Duration:</strong> {sleep_and_lifestyle_suggestions.sleep_duration}</Text>
                                <div style={{ margin: 10}}/>
                                <Text><strong>Sleep Tips:</strong> {sleep_and_lifestyle_suggestions.sleep_tips}</Text>
                                <div style={{ margin: 10}}/>
                                <Text><strong>Stress Management:</strong> {sleep_and_lifestyle_suggestions.stress_management}</Text>
                            </Card>
                        </div>
                    </TabPane>

                    <TabPane tab="Goals" key="4">
                        <div className="scroll-content">
                            <Card>
                                <Title level={4}>Your Fitness Goals</Title>
                                <Text><strong>Total Calories Goal:</strong> {goals.total_calories_goal} kcal</Text>
                                <div style={{ margin: 10}}/>
                                <Text><strong>Total Fat Goal:</strong> {goals.total_fat_goal} g</Text>
                                <div style={{ margin: 10}}/>
                                <Text><strong>Total Carbs Goal:</strong> {goals.total_carbs_goal} g</Text>
                                <div style={{ margin: 10}}/>
                                <Text><strong>Total Protein Goal:</strong> {goals.total_protein_goal} g</Text>
                            </Card>
                        </div>
                    </TabPane>
                </Tabs>
            </div>
        </Card>
    );
};

export default FitnessPlanComponent;
