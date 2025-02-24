import React, {useState, useEffect} from "react";
import styles from "./Search.module.css";
import Axios from "axios";
import {BASE_URL} from "../../config/Config";
import {Layout} from 'antd';
import NutritionSider from "./NutritionSider";

const {Content} = Layout;

const SearchFoodList = ({searchedFood}) => {
    const [responseList, setResponseList] = useState([]);

    useEffect(() => {

        const getData = async () => {
            const url = BASE_URL + `/api/food/search-food/${searchedFood}`;
            const response = await Axios.get(url);
            if (response.status === "success") {
                setResponseList(response.data);
            }
        };

        getData();
    }, []);

    return (
        <div className={styles.stockData}>
            <Layout className={styles.mainLayout}>
                <Content className={styles.sider}>
                    {responseList.length > 0 && (
                        <div>
                            {responseList}
                        </div>
                    )}
                </Content>
                {/*<NutritionSider selectedFood={searchedFood}/>*/}
            </Layout>


        </div>
    );
};

export default SearchFoodList;