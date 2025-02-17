import styles from './ProfileCreation.module.css';
import React from "react";
import { Form, InputNumber, Row } from "antd";

class InitialMeasurementsFormEl extends React.Component<any, any> {
    componentDidMount() {
        const { form, initialValues } = this.props;
        if (initialValues) {
            form.setFieldsValue({
                arms: initialValues.user_initial_measurements?.arms_in_cm || undefined,
                neck: initialValues.user_initial_measurements?.neck_in_cm || undefined,
                chest: initialValues.user_initial_measurements?.chest_in_cm || undefined,
                waist: initialValues.user_initial_measurements?.waist_in_cm || undefined,
                thighs: initialValues.user_initial_measurements?.thighs_in_cm || undefined,
                hips: initialValues.user_initial_measurements?.hips_in_cm || undefined,
            });
        }
    }

    /** Method to validate and return transformed values */
    getFormattedValues = (callback) => {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const formattedValues = {
                    user_initial_measurements: {
                        arms_in_cm: values.arms || null,
                        neck_in_cm: values.neck || null,
                        chest_in_cm: values.chest || null,
                        waist_in_cm: values.waist || null,
                        thighs_in_cm: values.thighs || null,
                        hips_in_cm: values.hips || null,
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
