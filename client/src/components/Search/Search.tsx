import React, {useState, useEffect, useContext} from "react";
import styles from "./Search.module.css";
import Axios from "axios";
import {BASE_URL, getHeaders} from "../../config/Config";
import {Button, Dropdown, Icon, Input, Menu, notification} from 'antd';
import UserContext from "../../context/UserContext";


const Search = () => {
    const [currentFood, setCurrentFood] = useState(null);
    const [loading, setLoading] = useState(true);
    const {userData} = useContext(UserContext);
    const [openAddFoodModal, setOpenAddFoodModal] = useState(false);
    const [addForm, setForm] = useState();


    const onSearchChange = (value) => {
        if (value) {
            setCurrentFood(value);
        } else {
            setCurrentFood(null);
        }
    };

    const onAddToDiary = () => {
        // add to diary and navigate to meal log page
    }

    return (
        <div className={styles.search_page}>
            <div className={styles.inputBox}>
                <div style={{marginLeft: currentFood ? 'auto' : 'unset'}}>
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
                    {currentFood && !loading && (
                        <StockCard
                            currentStock={currentFood}
                        />
                    )}
                </div>
            </div>
            {openAddFoodModal && (
                <AddWatchList wrappedComponentRef={(form) => setForm(form)}
                              showAddWL={openAddFoodModal}
                              setShowAddWL={setOpenAddFoodModal}
                              onAdd={onAddToDiary}
                />
            )
            }
        </div>
    );
};


export default Search;