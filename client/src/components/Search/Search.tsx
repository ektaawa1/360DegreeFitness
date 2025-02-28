import React, {useState, useEffect, useContext} from "react";
import styles from "./Search.module.css";
import {Input,} from 'antd';
import SearchFoodList  from './SearchFoodList';


const Search = () => {
    const [currentFood, setCurrentFood] = useState(null);


    const onSearchChange = (value) => {
        if (value) {
            setCurrentFood(value);
        } else {
            setCurrentFood(null);
        }
    };


    return (
        <div className={styles.search_page}>
            <div className={styles.inputBox}>
                <div style={{marginLeft: 'unset'}}>
                    <Input.Search
                        style={{width: 450, height: 50,}}
                        placeholder="Type food name and press Enter"
                        allowClear
                        defaultValue={currentFood}
                        onSearch={onSearchChange}
                    />
                </div>
            </div>
            <div className={styles.contentBox}>
                <div className={styles.stockCard}>
                    {currentFood && (
                        <SearchFoodList
                            searchedFood ={currentFood}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};


export default Search;