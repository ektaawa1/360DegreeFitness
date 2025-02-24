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

    useEffect(() => {
        const getData = async () => {
            const url = BASE_URL + `/api/food/search-food/${searchedFood}`;
            const response = await Axios.get(url);
            if (response.status === 200) {
                setResponseList(response.data.foods.food);
            }
        };

        getData();
    }, [searchedFood]);

    return (
        <div className={styles.stockData}>
            <Layout className={styles.mainLayout}>
                <Content className={styles.sider}>
                    <List
                        dataSource={responseList}
                        renderItem={(item) => (
                            <List.Item
                                className={styles.foodItem}
                                onClick={() => setSelectedFood(item)}
                                style={{ cursor: "pointer", padding: "10px", borderBottom: "1px solid #ddd" }}
                            >
                                <div>
                                    <b>{item.food_name}</b> {item.brand_name ? `(${item.brand_name})` : ""}
                                </div>
                            </List.Item>
                        )}
                    />
                </Content>
                {selectedFood && <NutritionSider food={selectedFood} />}
            </Layout>
        </div>
    );
};

export default SearchFoodList;
