import React from "react";
import { Modal, Form, Input, InputNumber, DatePicker } from "antd";
import moment from "moment";

const WeightForm = Form.create({ name: "weight_form" })(
    class extends React.Component<any, any> {
        render() {
            const { visible, onCancel, onCreate, form } = this.props;
            const { getFieldDecorator } = form;

            // Disable future dates
            const disableFutureDates = (current) => {
                return current && current > moment().endOf("day");
            };

            return (
                <Modal
                    visible={visible}
                    title="Add Weight"
                    okText="Submit"
                    onCancel={onCancel}
                    onOk={onCreate}
                >
                    <Form layout="vertical">
                        <Form.Item label="Date">
                            {getFieldDecorator("date", {
                                initialValue: moment(),
                            })(
                                <DatePicker
                                    disabledDate={disableFutureDates}
                                    style={{ width: "100%" }}
                                    format="YYYY-MM-DD"
                                />
                            )}
                        </Form.Item>
                        <Form.Item label="Weight (kg)">
                            {getFieldDecorator("weight", {
                                rules: [{ required: true, message: "Please input your weight!" }],
                            })(
                                <InputNumber
                                    placeholder="Weight (kg)"
                                    min={1}
                                    max={500}
                                    style={{ width: "100%" }}
                                />
                            )}
                        </Form.Item>
                        <Form.Item label="Notes">
                            {getFieldDecorator("notes")(<Input.TextArea placeholder="Notes (optional)" />)}
                        </Form.Item>
                    </Form>
                </Modal>
            );
        }
    }
);

export default WeightForm;
