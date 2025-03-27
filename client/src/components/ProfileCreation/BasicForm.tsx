import styles from './ProfileCreation.module.css';
import React from "react";
import {Form, Select, InputNumber, Row} from "antd";

const {Option} = Select;

class BasicFormEl extends React.Component<any, any> {
    componentDidMount() {
        const {form, initialValues} = this.props;
        if (initialValues) {
            const values = initialValues?.user_basic_details || {};
            values.user_fitness_goals = values.user_basic_details?.user_fitness_goals || initialValues.user_fitness_goals;
            form.setFieldsValue(values);
        }
    }

    /** Method to validate and return transformed values */
    getFormattedValues = (callback) => {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                // 🚀 Massage the values before returning
                const formattedValues = {
                    user_basic_details: {
                        ...values,
                        age: Number(values.age),
                        height_in_cm: Number(values.height_in_cm),
                        weight_in_kg: Number(values.weight_in_kg) || this.props.initialValues?.user_basic_details.weight_in_kg,
                        weight_goal_in_kg: Number(values.weight_goal_in_kg),
                        gender: values.gender
                    }
                };
                callback(null, formattedValues);
            } else {
                callback(err, null);
            }
        });
    };

    render() {
        const {getFieldDecorator} = this.props.form;
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
                    <Form.Item label="Age">
                        {getFieldDecorator("age", {rules: [{required: true, message: "Age is required!"}],})(
                            <InputNumber min={10} max={100}/>
                        )}
                        <span className="ant-form-text"> years</span>
                    </Form.Item>
                    <Form.Item label="Height">
                        {getFieldDecorator("height_in_cm", {rules: [{required: true, message: "Height is required!"}],})(
                            <InputNumber min={100} max={230}/>
                        )}
                        <span className="ant-form-text"> cm</span>
                    </Form.Item>
                    {!this.props.initialValues && <Form.Item label="Weight">
                        {getFieldDecorator("weight_in_kg", {rules: [{required: true, message: "Weight is required!"}],})(
                            <InputNumber min={30} max={500}/>
                        )}
                        <span className="ant-form-text"> kg</span>
                    </Form.Item>}
                    <Form.Item label="Weight Goal">
                        {getFieldDecorator("weight_goal_in_kg", {rules: [{required: true, message: "Weight Goal is required!"}],})(
                            <InputNumber min={30} max={500}/>
                        )}
                        <span className="ant-form-text"> kg</span>
                    </Form.Item>
                    <Form.Item label="Gender">
                        {getFieldDecorator("gender", {
                            initialValue: "Male",
                            rules: [{required: true, message: "Please select a gender!"}],
                        })(
                            <Select>
                                <Option value="Male">Male</Option>
                                <Option value="Female">Female</Option>
                                <Option value="Other">Other</Option>
                            </Select>
                        )}
                    </Form.Item>
                    <Form.Item label="Fitness Goals">
                        {getFieldDecorator("user_fitness_goals", {
                            rules: [{required: true, message: "Please select a fitness goal!"}],
                        })(
                            <Select>
                                <Option value='Weight Loss'>Weight Loss</Option>
                                <Option value='Weight Gain'>Weight Gain</Option>
                                <Option value="Muscle Gain">Muscle Gain</Option>
                                <Option value='Maintain Weight'>Maintain Weight</Option>
                                <Option value="Endurance">Endurance</Option>
                                <Option value="Get Healthier">Get Healthier</Option>

                            </Select>
                        )}
                    </Form.Item>
                </Row>
            </Form>
        );
    }
}

const BasicForm = Form.create()(BasicFormEl);
export default BasicForm;


