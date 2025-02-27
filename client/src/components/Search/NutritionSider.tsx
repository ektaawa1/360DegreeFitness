import styles from "./Search.module.css";
import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../config/Config";
import Axios from "axios";
import { Drawer } from 'antd';

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
                } else {
                    setFoodDetails(null);
                }
            } catch (error) {
                setFoodDetails(null);
            }
        };
        getData();
    }, [selectedFood]);

    if (!foodDetails) return null;

    const serving = foodDetails.servings.serving[0];

    return (
        <Drawer className={styles.nutrition_facts} onClose={onClose}
                title={`Nutrition Facts - ${foodDetails.food_name}`}
                placement="right"
                mask={false}
                maskClosable={false}
                closable={true}
                visible={true}
                width={400}>
            <div className={styles.nutrition_facts}>
                <div className={`${styles.heading} ${styles.black}`}>Nutrition Facts</div>
                <div className={`${styles.divider} ${styles.thin}`}/>
                <table className={styles.serving_size}>
                    <tbody>
                    <tr>
                        <td className={`${styles.serving_size} ${styles.black}`}>Serving Size</td>
                        <td className={`${styles.serving_size} ${styles.black}`}>
                            {serving.serving_description} ({serving.metric_serving_amount}{serving.metric_serving_unit})
                        </td>
                    </tr>
                    </tbody>
                </table>
                <div className={`${styles.divider} ${styles.thick}`}/>
                <div className={styles.left}>
                    <div className={`${styles.nutrient} ${styles.black}`}>Amount Per Serving</div>
                    <div className={`${styles.hero_label} ${styles.black}`}>Calories</div>
                </div>
                <div className={`${styles.hero_value} ${styles.black} ${styles.right}`}>{serving.calories}</div>
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
                    const value = serving[item.key] || 0;
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
                    const value = serving[item.key] || 0;
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
        </Drawer>
    );
};

export default NutritionSider;
