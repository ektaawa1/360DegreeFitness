import styles from "./ProfileCreation.module.css";
import React from "react";
import { Form, Row, Select, Input, Collapse, TimePicker } from "antd";

const { Option } = Select;
const { Panel } = Collapse;

class RoutineAssessmentFormEl extends React.Component<any, any> {
    componentDidMount() {
        const { form, initialValues } = this.props;
        if (initialValues) {
            form.setFieldsValue(initialValues.user_routine_assessment);
        }
    }

    getFormattedValues = (callback) => {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const formattedValues = {
                    user_routine_assessment: {
                        typical_meals: {
                            breakfast: values["typical_meals"]["breakfast"] ?? null,
                            lunch: values["typical_meals"]["lunch"] ?? null,
                            snacks: values["typical_meals"]["snacks"] ?? null,
                            dinner: values["typical_meals"]["dinner"] ?? null,
                        },
                        daily_routine: {
                            wakeup_time: values["daily_routine"]["wakeup_time"] ?? null,
                            breakfast_time: values["daily_routine"]["breakfast_time"] ?? null,
                            lunch_time: values["daily_routine"]["lunch_time"] ?? null,
                            evening_snacks_time: values["daily_routine"]["evening_snacks_time"] ?? null,
                            dinner_time: values["daily_routine"]["dinner_time"] ?? null,
                            bed_time: values["daily_routine"]["bed_time"] ?? null,
                        },
                        stress_audit: {
                            time_sitting_at_a_stretch: values["stress_audit"]["time_sitting_at_a_stretch"] ?? null,
                            time_standing_at_a_stretch: values["stress_audit"]["time_standing_at_a_stretch"] ?? null,
                            time_travelling_per_day: values["stress_audit"]["time_travelling_per_day"] ?? null,
                        },
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
                    <Collapse accordion>
                        <Panel header="Typical Meals" key="1">
                            <Form.Item label="Breakfast">
                                {getFieldDecorator("typical_meals.breakfast", {
                                })(<Input placeholder="E.g., Oats with milk" />)}
                            </Form.Item>
                            <Form.Item label="Lunch">
                                {getFieldDecorator("typical_meals.lunch", {
                                })(<Input placeholder="E.g., Salad with chickpeas" />)}
                            </Form.Item>
                            <Form.Item label="Snacks">
                                {getFieldDecorator("typical_meals.snacks")(
                                    <Input placeholder="E.g., Nuts and fruits" />
                                )}
                            </Form.Item>
                            <Form.Item label="Dinner">
                                {getFieldDecorator("typical_meals.dinner")(
                                    <Input placeholder="E.g., Rice with lentils" />
                                )}
                            </Form.Item>
                        </Panel>

                        <Panel header="Daily Routine" key="2">
                            {['wakeup_time', 'breakfast_time', 'lunch_time', 'evening_snacks_time', 'dinner_time', 'bed_time'].map((field, index) => (
                                <Form.Item label={field.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} key={index}>
                                    {getFieldDecorator(`daily_routine.${field}`)(
                                        <TimePicker format="h:mm A" use12Hours />
                                    )}
                                </Form.Item>
                            ))}
                        </Panel>

                        <Panel header="Stress Audit" key="3">
                            <Form.Item label="Time Sitting & Stretching">
                                {getFieldDecorator("stress_audit.time_sitting_at_a_stretch")(
                                    <Select>
                                        <Option value="30 minutes">30 minutes</Option>
                                        <Option value="1 hour">1 hour</Option>
                                        <Option value="2 hours">2 hours</Option>
                                        <Option value="3+ hours">3+ hours</Option>
                                    </Select>
                                )}
                            </Form.Item>
                            <Form.Item label="Time Standing & Stretching">
                                {getFieldDecorator("stress_audit.time_standing_at_a_stretch")(
                                    <Select>
                                        <Option value="30 minutes">30 minutes</Option>
                                        <Option value="1 hour">1 hour</Option>
                                        <Option value="2 hours">2 hours</Option>
                                        <Option value="3+ hours">3+ hours</Option>
                                    </Select>
                                )}
                            </Form.Item>
                            <Form.Item label="Time Driving">
                                {getFieldDecorator("stress_audit.time_travelling_per_day")(
                                    <Select>
                                        <Option value="15 minutes">15 minutes</Option>
                                        <Option value="30 minutes">30 minutes</Option>
                                        <Option value="1 hour">1 hour</Option>
                                        <Option value="2+ hours">2+ hours</Option>
                                    </Select>
                                )}
                            </Form.Item>
                        </Panel>
                    </Collapse>
                </Row>
            </Form>
        );
    }
}

const RoutineAssessmentForm = Form.create()(RoutineAssessmentFormEl);
export default RoutineAssessmentForm;
