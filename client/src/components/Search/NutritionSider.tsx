import styles from "./Search.module.css";
import React, {useEffect, useState} from "react";
import {BASE_URL} from "../../config/Config";
import Axios from "axios";
import {Layout} from 'antd';
const {Sider} = Layout;
const NutritionSider = ({selectedFood}) => {
    const [foodDetails, setFoodDetails] = useState(undefined);

    useEffect(() => {
        const getInfo = async () => {
            const url = BASE_URL + `/api/food-nutrition/${selectedFood}`;
            const response = await Axios.get(url);
            if (response.data.status === "success") {
                setFoodDetails(response.data.data);
            }
        };

        getInfo();
    }, []);

    return <NutritionSider width="25%" className={styles.sider} >
        {foodDetails && (
            {}
        )}
    </NutritionSider>
}

export default NutritionSider;