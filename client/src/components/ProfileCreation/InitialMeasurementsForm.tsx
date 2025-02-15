import styles from './ProfileCreation.module.css';
import React from "react";
import { Form, InputNumber, Row } from "antd";

class InitialMeasurementsFormEl extends React.Component<any, any> {
    componentDidMount() {
        const { form, initialValues } = this.props;
        if (initialValues) {
            form.setFieldsValue(initialValues.initial_measurements);
        }
    }

    /** Method to validate and return transformed values */
    getFormattedValues = (callback) => {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const formattedValues = {
                    initial_measurements: {
                        arms: Number(values.arms) || undefined,
                        neck: Number(values.neck) || undefined,
                        chest: Number(values.chest) || undefined,
                        waist: Number(values.waist) || undefined,
                        thighs: Number(values.thighs) || undefined,
                        hips: Number(values.hips) || undefined,
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
            labelCol: {
                xs: { span: 3 },
                sm: { span: 3 },
            },
            wrapperCol: {
                xs: { span: 5 },
                sm: { span: 5 },
            },
        };
        return (
            <Form {...formItemLayout} className={styles.basicForm}>
                <Row gutter={24}>
                    <Form.Item label="Arms">
                        {getFieldDecorator("arms")(
                            <InputNumber min={10} max={60} />
                        )}
                        <span className="ant-form-text"> cm</span>
                    </Form.Item>
                    <Form.Item label="Neck">
                        {getFieldDecorator("neck")(
                            <InputNumber min={10} max={60} />
                        )}
                        <span className="ant-form-text"> cm</span>
                    </Form.Item>
                    <Form.Item label="Chest">
                        {getFieldDecorator("chest")(
                            <InputNumber min={50} max={150} />
                        )}
                        <span className="ant-form-text"> cm</span>
                    </Form.Item>
                    <Form.Item label="Waist">
                        {getFieldDecorator("waist")(
                            <InputNumber min={50} max={150} />
                        )}
                        <span className="ant-form-text"> cm</span>
                    </Form.Item>
                    <Form.Item label="Thighs">
                        {getFieldDecorator("thighs")(
                            <InputNumber min={30} max={100} />
                        )}
                        <span className="ant-form-text"> cm</span>
                    </Form.Item>
                    <Form.Item label="Hips">
                        {getFieldDecorator("hips")(
                            <InputNumber min={50} max={150} />
                        )}
                        <span className="ant-form-text"> cm</span>
                    </Form.Item>
                </Row>
            </Form>
        );
    }
}

const InitialMeasurementsForm = Form.create()(InitialMeasurementsFormEl);
export default InitialMeasurementsForm;
