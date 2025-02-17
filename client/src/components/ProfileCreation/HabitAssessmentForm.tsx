import styles from './ProfileCreation.module.css';
import React from "react";
import { Form, Row, Select, InputNumber } from "antd";

const { Option } = Select;

class HealthAssessmentFormEl extends React.Component<any, any> {
    componentDidMount() {
        const { form, initialValues } = this.props;
        if (initialValues) {
            form.setFieldsValue(initialValues.user_habits_assessment);
        }
    }

    /** Method to validate and return transformed values */
    getFormattedValues = (callback) => {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const formattedValues = {
                    user_habits_assessment: {
                        daily_water_intake_in_liter: values.daily_water_intake_in_liter || null,
                        weekly_workout_frequency: values.weekly_workout_frequency ?? null, // Keep 0 if entered, else null
                        diet_preference: values.diet_preference || null,
                        uncomfortable_foods: values.foods_uncomfortable && values.foods_uncomfortable.length > 0
                            ? values.foods_uncomfortable
                            : null,
                        activity_level: values.activity_level || null
                    }
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
            labelCol: { xs: { span: 6 }, sm: { span: 6 } },
            wrapperCol: { xs: { span: 12 }, sm: { span: 12 } },
        };

        return (
            <Form {...formItemLayout} className={styles.basicForm}>
                <Row gutter={24}>
                    <Form.Item label="Daily Water Intake (liters)">
                        {getFieldDecorator("daily_water_intake_in_liter")(
                            <Select placeholder="Select intake">
                                <Option value="1 liter">1 liter</Option>
                                <Option value="2 liters">2 liters</Option>
                                <Option value="3 liters">3 liters</Option>
                                <Option value="4 liters">4 liters</Option>
                                <Option value="5 liters">5 liters</Option>
                            </Select>
                        )}
                    </Form.Item>
                    <Form.Item label="Weekly Workout Frequency">
                        {getFieldDecorator("weekly_workout_frequency")(
                            <InputNumber min={0} max={7} placeholder="Days per week" />
                        )}
                    </Form.Item>
                    <Form.Item label="Diet Preference">
                        {getFieldDecorator("diet_preference")(
                            <Select placeholder="Select diet">
                                <Option value="Vegetarian">Vegetarian</Option>
                                <Option value="Non-Vegetarian">Non-Vegetarian</Option>
                                <Option value="Vegan">Vegan</Option>
                                <Option value="Gluten-Free">Gluten-Free</Option>
                                <Option value="Keto">Keto</Option>
                            </Select>
                        )}
                    </Form.Item>
                    <Form.Item label="Foods Uncomfortable With">
                        {getFieldDecorator("uncomfortable_foods")(
                            <Select mode="multiple" placeholder="Select foods">
                                <Option value="Gluten">Gluten</Option>
                                <Option value="Dairy">Dairy</Option>
                                <Option value="Nuts">Nuts</Option>
                                <Option value="Soy">Soy</Option>
                            </Select>
                        )}
                    </Form.Item>
                    <Form.Item label="Activity Level">
                        {getFieldDecorator("activity_level")(
                            <Select placeholder="Select activity level">
                                <Option value="Sedentary">Sedentary</Option>
                                <Option value="Lightly active">Lightly active</Option>
                                <Option value="Moderately active">Moderately active</Option>
                                <Option value="Very active">Very active</Option>
                                <Option value="Super active">Super active</Option>
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
