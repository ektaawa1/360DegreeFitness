import styles from './ProfileCreation.module.css';
import React from "react";
import {Form, Select, InputNumber, Row} from "antd";

const {Option} = Select;

class BasicFormEl extends React.Component<any, any> {
    componentDidMount() {
        const {form, initialValues} = this.props;
        if (initialValues) {
            form.setFieldsValue(initialValues);
        }
    }

    /** Method to validate and return transformed values */
    getFormattedValues = (callback) => {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                // 🚀 Massage the values before returning
                const formattedValues = {
                    user_details: {
                        ...values,
                        age: Number(values.age),
                        height: Number(values.height),
                        weight: Number(values.weight),
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
                xs: {span: 3},
                sm: {span: 3},
            },
            wrapperCol: {
                xs: {span: 5},
                sm: {span: 5},
            },
        };
        return (
            <Form {...formItemLayout} onSubmit={this.handleSubmit} className={styles.basicForm}>
                <Row gutter={24}>
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
                    <Form.Item label="Age">
                        {getFieldDecorator("age", {rules: [{required: true, message: "Age is required!"}],})(
                            <InputNumber min={10} max={100}/>
                        )}
                        <span className="ant-form-text"> years</span>
                    </Form.Item>
                    <Form.Item label="Height">
                        {getFieldDecorator("height", {rules: [{required: true, message: "Height is required!"}],})(
                            <InputNumber min={100} max={230}/>
                        )}
                        <span className="ant-form-text"> cm</span>
                    </Form.Item>
                    <Form.Item label="Weight">
                        {getFieldDecorator("weight", {rules: [{required: true, message: "Weight is required!"}],})(
                            <InputNumber min={30} max={200}/>
                        )}
                        <span className="ant-form-text"> kg</span>
                    </Form.Item>
                </Row>
            </Form>
        );
    }
}

const BasicForm = Form.create()(BasicFormEl);
export default BasicForm;


