import React, { useState, useEffect } from "react";
import styles from "./Search.module.css";
import Axios from "axios";
import { BASE_URL } from "../../config/Config";
import { Layout, List } from "antd";
import NutritionSider from "./NutritionSider";

const { Content } = Layout;

const SearchFoodList = ({ searchedFood }) => {
    const [responseList, setResponseList] = useState([]);
    const [selectedFood, setSelectedFood] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const getData = async () => {
            setVisible(false);
            if (!searchedFood) {
                setResponseList([]);
                return;
            }
            const url = BASE_URL + `/api/food/search-food/${searchedFood}`;
            const response = await Axios.get(url);
            if (response.status === 200) {
                setResponseList(response.data.food_options);
            }
        };

        getData();
    }, [searchedFood]);

    return (
        <div className={styles.stockData}>
            <Layout className={styles.mainLayout}>
                <Content className={styles.sider}>
                    <List
                        itemLayout="horizontal"
                        dataSource={(responseList || []).filter(food => food.food_name.toLowerCase().includes(searchedFood.toLowerCase()))}
                        renderItem={(item) => (
                            <List.Item onClick={() => {
                                setSelectedFood(item)
                                setVisible(true);
                            }} style={{ cursor: "pointer"}}>
                                <List.Item.Meta
                                    title={<span className={styles.foodName}>{item.food_name}</span>}
                                    description={<span className={styles.foodDescription}>{item.food_description}</span>}
                                />
                            </List.Item>
                        )}
                    />
                </Content>
            </Layout>
            {visible && <NutritionSider selectedFood={selectedFood} onClose={() => setVisible(false)}/> }
        </div>
    );
};

export default SearchFoodList;
