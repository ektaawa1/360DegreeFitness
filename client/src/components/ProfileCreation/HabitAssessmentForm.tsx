import styles from './ProfileCreation.module.css';
import React from "react";
import { Form, Row, Select, InputNumber } from "antd";

const { Option } = Select;

class HealthAssessmentFormEl extends React.Component<any, any> {
    componentDidMount() {
        const { form, initialValues } = this.props;
        if (initialValues) {
            form.setFieldsValue(initialValues.habits_assessment);
        }
    }

    /** Method to validate and return transformed values */
    getFormattedValues = (callback) => {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const formattedValues = {
                    habits_assessment: { ...values }
                };
                callback(null, formattedValues);
            } else {
                callback(err, null);
            }
        });
    };

    render() {
        const { getFieldDecorator } = this.props.form;
        const formItemLayout = {
            labelCol: {
                xs: { span: 6 },
                sm: { span: 6 },
            },
            wrapperCol: {
                xs: { span: 12 },
                sm: { span: 12 },
            },
        };


        return (
            <Form {...formItemLayout} className={styles.basicForm}>
                <Row gutter={24}>
                    <Form.Item label="Daily Water Intake">
                        {getFieldDecorator("daily_water_intake", {
                            rules: [{ required: true, message: "Please select water intake!" }],
                        })(
                            <Select>
                                <Option value="1 liter">1 liter</Option>
                                <Option value="2 liters">2 liters</Option>
                                <Option value="3 liters">3 liters</Option>
                                <Option value="4+ liters">4+ liters</Option>
                            </Select>
                        )}
                    </Form.Item>
                        <Form.Item label="Weekly Workout Frequency">
                            {getFieldDecorator("weekly_workout_frequency", {
                                rules: [{ required: true, message: "Please enter workout frequency!" }],
                            })(<InputNumber min={0} max={7} />)}
                        </Form.Item>
                        <Form.Item label="Diet Preference">
                            {getFieldDecorator("diet_preference", {
                            })(
                                <Select>
                                    <Option value="Vegetarian">Vegetarian</Option>
                                    <Option value="Vegan">Vegan</Option>
                                    <Option value="Pescatarian">Pescatarian</Option>
                                    <Option value="Omnivore">Omnivore</Option>
                                </Select>
                            )}
                        </Form.Item>
                        <Form.Item label="Foods Uncomfortable With">
                            {getFieldDecorator("foods_uncomfortable", {
                            })(
                                <Select mode="multiple" placeholder="Select foods">
                                    <Option value="Gluten">Gluten</Option>
                                    <Option value="Dairy">Dairy</Option>
                                    <Option value="Nuts">Nuts</Option>
                                    <Option value="Soy">Soy</Option>
                                </Select>
                            )}
                        </Form.Item>
                        <Form.Item label="Activity Level">
                            {getFieldDecorator("activity_level", {
                                rules: [{ required: true, message: "Please select activity level!" }],
                            })(
                                <Select>
                                    <Option value="Sedentary">Sedentary</Option>
                                    <Option value="Lightly active">Lightly active</Option>
                                    <Option value="Moderately active">Moderately active</Option>
                                    <Option value="Very active">Very active</Option>
                                </Select>
                            )}
                        </Form.Item>
                </Row>
            </Form>
        );
    }
}

const HealthAssessmentForm = Form.create()(HealthAssessmentFormEl);
export default HealthAssessmentForm;
