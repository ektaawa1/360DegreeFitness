import React, {useEffect, useState, createRef} from "react";
import {Modal, Steps, Button, Progress, message} from 'antd';
import Axios from "axios";
import {BASE_URL} from "../../config/Config";
import BasicForm from "./BasicForm";
import InitialMeasurementsForm from "./InitialMeasurementsForm";
import HealthDetailsForm from "./HealthDetailsForm";
import HabitAssessmentForm from "./HabitAssessmentForm";
import RoutineAssessmentForm from "./RoutineAssessmentForm";

const { Step } = Steps;

const steps = [
    {
        title: 'User Details',
        content: BasicForm,
    },
    {
        title: 'Initial Measurements',
        content: InitialMeasurementsForm,
    },
    {
        title: 'Health Details',
        content: HealthDetailsForm,
    },
    {
        title: 'Habits',
        content: HabitAssessmentForm,
    },
    {
        title: 'Routine',
        content: RoutineAssessmentForm,
    },
];
const ProfileCreation = ({userData, editMode, onClose}) => {

    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(true);
    const [current, setCurrentStep] = useState(0);

    const [profileData, setProfile] = useState({});

    useEffect(() => {

        if (userData.profile_created) {
            // fetch current profile
            let token = localStorage.getItem("auth-token");
            const headers = {
                "x-auth-token": token,
            };
            const fetchProfile = async () => {
                const url = BASE_URL + "/api/profile/get-profile";
                const profile = await Axios.get(url, {headers}  );
                setProfile(profile.data);
                setLoading(false);
            }

            void fetchProfile();
        } else {
            setLoading(false);
        }

    }, []);

    const handleValidateForm = () => {
        void formRef.current?.getFormattedValues((err, values) => {
            if (!err) {
                const data = {...profileData, ...values};
                setProfile(data);
                next(data);
            } else {
                message.error("Please fix the form errors before proceeding.");
            }
        });
    };

    const handleValidateFormPrev = () => {
        void formRef.current?.getFormattedValues((err, values) => {
            if (!err) {
                setProfile({...profileData, ...values});
                prev();
            } else {
                message.error("Please fix the form errors before proceeding.");
            }
        });
    };



    const next = (data) => {
        if (current === steps.length - 1) {
            handleOk(data);
        } else {
            setCurrentStep(current + 1 );
        }
    }

    const prev = () => {
        setCurrentStep(current - 1 );
    }

    const handleAction = async (data) => {
        let token = localStorage.getItem("auth-token");
        const headers = {
            "x-auth-token": token,
        };
        if (userData.profile_created) {
            const url = BASE_URL + "/api/profile/update-profile";
            const response = await Axios.put(url, data, {
                 headers
             });
            message.success(response.data.message  || 'Profile updated successfully!!', 5);
            setVisible(false);
            onClose();
            // set message
        } else {
            const url = BASE_URL + "/api/profile/create-profile";
            const response = await Axios.post(url, data, {
                headers
            });
            message.success(response.data.message || 'Profile created successfully!!', 5);
            // set message
            setVisible(false);
            onClose();
        }
    }


    const handleOk = (data) => {
        setLoading(true);
        setTimeout(() => {
            // Make API call here
            void handleAction(data);
        }, 200);
    };

    const ComponentToRender = steps[current].content;
    const formRef = createRef<any>();

    return (


        <Modal
            visible={visible}
            title="Profile"
            closable={userData.profile_created}
            maskClosable={userData.profile_created}
            centered={true}
            width={'80vw'}
            bodyStyle={{height: '80vh', width: '80vw'}}
            keyboard={userData.profile_created}
            onOk={handleOk}
            onCancel={() => {
                setVisible(false);
                onClose();
            }}
            footer={[
                <Button onClick={handleValidateFormPrev} disabled={current === 0 || loading}>
                    Previous
                </Button>,
                <Button type="primary" onClick={handleValidateForm} disabled={loading || current === 4}>
                    Next
                </Button>,
                <Button key="submit" type="primary" onClick={handleValidateForm} disabled={current !== 4 || loading}>
                    Submit
                </Button>,
            ]}
        >
            <div>
                <Steps current={current} progressDot>
                    {steps.map(item => (
                        <Step key={item.title} title={item.title} />
                    ))}
                </Steps>
                {loading ? <Progress /> : <div className="steps-content">
                    <ComponentToRender wrappedComponentRef={formRef} initialValues={profileData}/>
                </div>}

            </div>
        </Modal>

    );

}

export default ProfileCreation;