import styles from "./Search.module.css";
import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../config/Config";
import Axios from "axios";
import {Drawer, message, Select} from 'antd';
import ServingForm from "./ServingForm";

const { Option } = Select;

const DAILY_VALUES = {
    fat: 78, // g
    saturated_fat: 20, // g
    cholesterol: 300, // mg
    sodium: 2300, // mg
    carbohydrate: 275, // g
    fiber: 28, // g
    sugar: 50, // g
    protein: 50, // g
    vitamin_d: 20, // mcg
    calcium: 1300, // mg
    iron: 18, // mg
    potassium: 4700, // mg,
};

const getDailyValue = (nutrient, amount) => {
    if (!DAILY_VALUES[nutrient] || amount === 0) return "—";
    return `${Math.round((amount / DAILY_VALUES[nutrient]) * 100)}%`;
};

const NutritionSider = ({ selectedFood, onClose }) => {
    const [foodDetails, setFoodDetails] = useState(null);
    const [selectedServing, setSelectedServing] = useState(null);

    useEffect(() => {
        const getData = async () => {
            if (!selectedFood) {
                setFoodDetails(null);
                return;
            }
            try {
                const url = `${BASE_URL}/api/food/food-nutrition/${selectedFood.food_id}`;
                const response = await Axios.get(url);
                if (response.status === 200) {
                    setFoodDetails(response.data.food);
                    setSelectedServing(response.data.food.servings.serving[0]); // Default to the first serving
                } else {
                    setFoodDetails(null);
                }
            } catch (error) {
                setFoodDetails(null);
            }
        };
        getData();
    }, [selectedFood]);

    const onSubmitMeal = async (data) => {
        try {
            let token = localStorage.getItem("auth-token");
            const headers = {
                "x-auth-token": token,
            };
            const url = `${BASE_URL}/api/food/add-meal`;
            const response = await Axios.post(url, data, {headers});
            if (response.status === 200) {
                message.success((<div>Meal Added Successfully!!</div>), 10);
            } else {
                setFoodDetails(null);
            }
        } catch (error) {
            setFoodDetails(null);
        }
    };

    const handleServingChange = (servingId) => {
        const selected = foodDetails.servings.serving.find(serving => serving.serving_id === servingId);
        setSelectedServing(selected);
    };

    if (!foodDetails || !selectedServing) return null;

    return (
        <Drawer className={styles.nutrition_facts} onClose={onClose}
                title={`Nutrition Facts - ${foodDetails.food_name}`}
                placement="right"
                mask={false}
                maskClosable={false}
                closable={true}
                visible={true}
                width={500}>
            <div className={styles.nutrition_facts}>
                <div className={`${styles.heading} ${styles.black}`}>Nutrition Facts</div>
                <div className={`${styles.divider} ${styles.thin}`}/>
                <div className={styles.serving_selector}>
                    <span className={`${styles.serving_size} ${styles.black}`}>Serving Size: </span>
                    <Select
                        defaultValue={selectedServing.serving_id}
                        key={selectedServing.serving_id}
                        size={"small"}

                        dropdownMatchSelectWidth={false}
                        onChange={handleServingChange}
                    >
                        {foodDetails.servings.serving.map((serving) => (
                            <Option key={serving.serving_id} value={serving.serving_id}>
                                {serving.serving_description} ({serving.metric_serving_amount}{serving.metric_serving_unit})
                            </Option>
                        ))}
                    </Select>
                </div>
                <div className={`${styles.divider} ${styles.thick}`}/>
                <div className={styles.left}>
                    <div className={`${styles.nutrient} ${styles.black}`}>Amount Per Serving</div>
                    <div className={`${styles.hero_label} ${styles.black}`}>Calories</div>
                </div>
                <div className={`${styles.hero_value} ${styles.black} ${styles.right}`}>{selectedServing.calories}</div>
                <div className={`${styles.divider} ${styles.medium}`}/>
                <div className={`${styles.nutrient} ${styles.left}`}>&nbsp;</div>
                <div className={`${styles.nutrient} ${styles.black} ${styles.right}`}>% Daily Values*</div>
                <div className={`${styles.divider} ${styles.thin}`}/>

                {[
                    { label: "Total Fat", key: "fat", unit: "g" },
                    { label: "Saturated Fat", key: "saturated_fat", unit: "g", isSub: true },
                    { label: "Trans Fat", key: "trans_fat", unit: "g", isSub: true },
                    { label: "Cholesterol", key: "cholesterol", unit: "mg" },
                    { label: "Sodium", key: "sodium", unit: "mg" },
                    { label: "Total Carbohydrate", key: "carbohydrate", unit: "g" },
                    { label: "Dietary Fiber", key: "fiber", unit: "g", isSub: true },
                    { label: "Sugars", key: "sugar", unit: "g", isSub: true },
                    { label: "Protein", key: "protein", unit: "g" }
                ].map((item, index) => {
                    const value = selectedServing[item.key] || 0;
                    return (
                        <React.Fragment key={index}>
                            <div className={`${styles.nutrient} ${item.isSub ? styles.sub : styles.black} ${styles.left}`}>{item.label}</div>
                            <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>{value}{item.unit}</div>
                            {DAILY_VALUES[item.key] && (
                                <div className={`${styles.nutrient} ${styles.black} ${styles.right}`}>
                                    {getDailyValue(item.key, value)}
                                </div>
                            )}
                            <div className={`${styles.divider} ${styles.thin}`} />
                        </React.Fragment>
                    );
                })}

                {[
                    { label: "Vitamin D", key: "vitamin_d", unit: "mcg" },
                    { label: "Calcium", key: "calcium", unit: "mg" },
                    { label: "Iron", key: "iron", unit: "mg" },
                    { label: "Potassium", key: "potassium", unit: "mg" }
                ].map((item, index) => {
                    const value = selectedServing[item.key] || 0;
                    return (
                        <React.Fragment key={index}>
                            <div className={`${styles.nutrient} ${styles.left}`}>{item.label}</div>
                            <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>{value}{item.unit}</div>
                            <div className={`${styles.nutrient} ${styles.right}`}>{getDailyValue(item.key, value)}</div>
                            <div className={`${styles.divider} ${styles.thin}`} />
                        </React.Fragment>
                    );
                })}

                <div className={`${styles.divider} ${styles.medium}`}/>
                <div className={styles.footnote}>
                    * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet.
                    2,000 calories a day is used for general nutrition advice.
                </div>
            </div>
            <ServingForm foodData={foodDetails} onSubmit={onSubmitMeal}/>
        </Drawer>
    );
};

export default NutritionSider;
