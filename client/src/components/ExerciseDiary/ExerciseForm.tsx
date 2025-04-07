import React from "react";
import { Modal, Form, Input, InputNumber, DatePicker, Select, Button } from "antd";
import moment from "moment";
import { BASE_URL } from "../../config/Config";
import Axios from "axios";

const { Option } = Select;

const exerciseOptions = [
    "Aerobics", "Billiards", "Bowling", "Brisk Walking", "Cardio", "Cycling", "Dancing",
    "Frisbee", "HIIT", "Horseback Riding", "Jogging", "Kayaking", "Others", "Pilates",
    "Running", "Skateboarding", "Snorkeling", "Strength Training", "Stretching",
    "Swimming", "Table Tennis", "Tennis", "Volleyball", "Yoga", "Zumba"
];

const intensityOptions = ["Low", "Moderate", "High"];

const ExerciseForm = Form.create({ name: "exercise_form" })(
    class extends React.Component<any, any> {
        state = {
            caloriesBurnt: 0,
            showOtherInput: false,
        };

        handleExerciseChange = (value) => {
            this.setState({ showOtherInput: value === "Others" });
        };

        fetchCalories = async () => {
            const { form } = this.props;
            form.validateFields(["date", "exercise_type", "duration_minutes", "intensity_type", "other_exercise"], async (err, values) => {
                if (!err) {
                    try {
                        let token = sessionStorage.getItem("auth-token");
                        const headers = { "x-auth-token": token };
                        const url = BASE_URL + `/api/exercise/calculate-calories`;
                        const payload = { ...values, date: values.date.format("YYYY-MM-DD") };
                        if (payload.exercise_type === 'Others') {
                            payload.exercise_type = payload.other_exercise;
                        }
                        const response = await Axios.post(url, payload, { headers });
                        const data = response.data.data;
                        this.setState({ caloriesBurnt: data.calories_burnt });
                        form.setFieldsValue({ calories_burnt: data.calories_burnt });
                    } catch (error) {
                        console.error("Error fetching calories:", error);
                    }
                }
            });
        };

        render() {
            const { visible, onCancel, onCreate, form } = this.props;
            const { getFieldDecorator } = form;
            const { caloriesBurnt, showOtherInput } = this.state;
            const disableFutureDates = (current) => current && current > moment().endOf("day");

            return (
                <Modal
                    visible={visible}
                    title="Add Exercise"
                    okText="Submit"
                    onCancel={onCancel}
                    onOk={() => {
                        form.validateFields((err, values) => {
                            if (!err) {
                                const payload = { ...values, date: values.date.format("YYYY-MM-DD"), calories_burnt: caloriesBurnt };
                                if (payload.exercise_type === 'Others') {
                                    payload.exercise_type = payload.other_exercise;
                                }
                                onCreate(payload, () => {
                                    this.setState({ caloriesBurnt: 0, showOtherInput: false });
                                    form.resetFields();
                                });
                            }
                        });
                    }}
                >
                    <Form layout="vertical">
                        <Form.Item label="Date">
                            {getFieldDecorator("date", {
                                initialValue: moment(),
                                rules: [{ required: true, message: "Please select a date!" }],
                            })(
                                <DatePicker
                                    disabledDate={disableFutureDates}
                                    style={{ width: "100%" }}
                                    format="YYYY-MM-DD"
                                />
                            )}
                        </Form.Item>
                        <Form.Item label="Exercise Type">
                            {getFieldDecorator("exercise_type", {
                                rules: [{ required: true, message: "Please select an exercise type!" }],
                            })(
                                <Select
                                    placeholder="Select exercise"
                                    onChange={this.handleExerciseChange}
                                    style={{ width: "100%" }}
                                >
                                    {exerciseOptions.map((type) => (
                                        <Option key={type} value={type}>{type}</Option>
                                    ))}
                                </Select>
                            )}
                        </Form.Item>
                        {showOtherInput && (
                            <Form.Item label="Other Exercise Type">
                                {getFieldDecorator("other_exercise")(
                                    <Input placeholder="Enter exercise type" />
                                )}
                            </Form.Item>
                        )}
                        <Form.Item label="Duration (minutes)">
                            {getFieldDecorator("duration_minutes", {
                                rules: [{ required: true, message: "Please enter duration!" }],
                            })(
                                <InputNumber min={1} max={300} style={{ width: "100%" }} />
                            )}
                        </Form.Item>
                        <Form.Item label="Intensity Type">
                            {getFieldDecorator("intensity_type", {
                                rules: [{ required: true, message: "Please select intensity!" }],
                            })(
                                <Select style={{ width: "100%" }}>
                                    {intensityOptions.map((level) => (
                                        <Option key={level} value={level.toLowerCase()}>{level}</Option>
                                    ))}
                                </Select>
                            )}
                        </Form.Item>
                        <Button type={"ghost"} onClick={this.fetchCalories} style={{ marginBottom: "10px" }}>
                            Fetch Calories
                        </Button>
                        <Form.Item label="Calories Burnt">
                            {getFieldDecorator("calories_burnt", {
                                initialValue: caloriesBurnt,
                                rules: [{ required: true, message: "Calories value is required!" }],
                            })(
                                <InputNumber
                                    min={0}
                                    style={{ width: "100%" }}
                                    onChange={(value) => this.setState({ caloriesBurnt: value })}
                                />
                            )}
                        </Form.Item>
                    </Form>
                </Modal>
            );
        }
    }
);

export default ExerciseForm;