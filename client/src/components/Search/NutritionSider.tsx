import styles from "./Search.module.css";
import React, {useEffect, useState} from "react";
import {BASE_URL} from "../../config/Config";
import Axios from "axios";
import {Drawer} from 'antd';

const NutritionSider = ({selectedFood, onClose}) => {
    const [foodDetails, setFoodDetails] = useState(undefined);

    useEffect(() => {
        const getData = async () => {
            if (!selectedFood) {
                setFoodDetails(null);
                return;
            }
            const url = BASE_URL + `/api/food/food-nutrition/${selectedFood.food_id}`;
            const response = await Axios.get(url);
            if (response.status === 200) {
                setFoodDetails(response.data.food);
            } else {
                setFoodDetails(null);
            }
        };

        getData();
    }, [selectedFood]);

    return <Drawer className={styles.nutrition_facts} onClose={onClose}
                   title={"Nutrition Facts - " + selectedFood.food_name}
                   placement="right"
                   mask={false}
                   maskClosable={false}
                   closable={true}
                   visible={true}
                   width={400}>
        {foodDetails && (
            <div className={styles.nutrition_facts}>
                <div className={`${styles.heading} ${styles.black}`}>Nutrition Facts</div>
                <div className={`${styles.divider} ${styles.thin}`}/>
                <table className={styles.serving_size}>
                    <colgroup>
                        <col width="90px"/>
                        <col width="*"/>
                    </colgroup>
                    <tbody>
                    <tr>
                        <td className={`${styles.serving_size} ${styles.black} ${styles.us} ${styles.serving_size_label}`}>Serving Size</td>
                        <td className={`${styles.serving_size} ${styles.black} ${styles.us} ${styles.serving_size_value}`}>1 egg (50 g)</td>
                    </tr>
                    </tbody>
                </table>
                <div className={`${styles.divider} ${styles.thick}`}/>
                <div className={styles.left}>
                    <div className={`${styles.nutrient} ${styles.black}`}>Amount Per Serving</div>
                    <div className={`${styles.hero_label} ${styles.black}`}>Calories</div>
                </div>
                <div className={`${styles.hero_value} ${styles.black} ${styles.right}`}>70</div>
                <div className={`${styles.divider} ${styles.medium}`}/>
                <div className={`${styles.nutrient} ${styles.left}`}>&nbsp;</div>
                <div className={`${styles.nutrient} ${styles.black} ${styles.right}`}>% Daily Values*</div>
                <div className={`${styles.divider} ${styles.thin}`}/>
                <div className={`${styles.nutrient} ${styles.black} ${styles.left}`}>Total Fat</div>
                <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>5.00g</div>
                <div className={`${styles.nutrient} ${styles.black} ${styles.right}`}>6%</div>
                <div className={`${styles.divider} ${styles.thin}`}/>

                <div className={`${styles.nutrient} ${styles.sub} ${styles.left}`}>Saturated Fat</div>
                <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>1.500g</div>
                <div className={`${styles.nutrient} ${styles.black} ${styles.right}`}>8%</div>
                <div className={`${styles.divider} ${styles.thin}`}/>

                <div className={`${styles.nutrient} ${styles.sub} ${styles.left}`}><i>Trans</i> Fat</div>
                <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>-</div>
                <div className={`${styles.divider} ${styles.thin}`}/>

                <div className={`${styles.nutrient} ${styles.black} ${styles.left}`}>Cholesterol</div>
                <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>190mg</div>
                <div className={`${styles.nutrient} ${styles.black} ${styles.right}`}>63%</div>
                <div className={`${styles.divider} ${styles.thin}`}/>

                <div className={`${styles.nutrient} ${styles.black} ${styles.left}`}>Sodium</div>
                <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>55mg</div>
                <div className={`${styles.nutrient} ${styles.black} ${styles.right}`}>2%</div>
                <div className={`${styles.divider} ${styles.thin}`}/>
                <div className={`${styles.nutrient} ${styles.black} ${styles.left}`}>Total Carbohydrate</div>
                <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>0.00g</div>
                <div className={`${styles.nutrient} ${styles.black} ${styles.right}`}>0%</div>
                <div className={`${styles.divider} ${styles.thin}`}/>

                <div className={`${styles.nutrient} ${styles.sub} ${styles.left}`}>Dietary Fiber</div>
                <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>-</div>
                <div className={`${styles.nutrient} ${styles.black} ${styles.right}`}/>
                <div className={`${styles.divider} ${styles.thin}`}/>

                <div className={`${styles.nutrient} ${styles.sub} ${styles.left}`}>Sugars</div>
                <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>-</div>
                <div className={`${styles.divider} ${styles.thin}`}/>

                <div className={`${styles.nutrient} ${styles.black} ${styles.left}`}>Protein</div>
                <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>6.00g</div>
                <div className={`${styles.divider} ${styles.thick}`}/>

                <div className={`${styles.nutrient} ${styles.left}`}>Vitamin D</div>
                <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>1mcg</div>
                <div className={`${styles.nutrient} ${styles.right}`}>5%</div>
                <div className={`${styles.divider} ${styles.thin}`}/>

                <div className={`${styles.nutrient} ${styles.left}`}>Calcium</div>
                <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>30mg</div>
                <div className={`${styles.nutrient} ${styles.right}`}>2%</div>
                <div className={`${styles.divider} ${styles.thin}`}/>

                <div className={`${styles.nutrient} ${styles.left}`}>Iron</div>
                <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>0.90mg</div>
                <div className={`${styles.nutrient} ${styles.right}`}>5%</div>
                <div className={`${styles.divider} ${styles.thin}`}/>

                <div className={styles.nutrient}>Potassium</div>
                <div className={`${styles.nutrient} ${styles.value} ${styles.left}`}>70mg</div>
                <div className={`${styles.nutrient} ${styles.right}`}>1%</div>

                <div className={`${styles.divider} ${styles.medium}`}/>
                <div className={styles.footnote}>* The % Daily Value (DV) tells you how much a nutrient in a serving of food
                    contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
                </div>
            </div>
        )}
    </Drawer>
}

export default NutritionSider;