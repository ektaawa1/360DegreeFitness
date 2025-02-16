import React, {useEffect, useState, createRef} from "react";
import {Modal, Steps, Button, Progress, message} from 'antd';
import Axios from "axios";
import {BASE_URL} from "../../config/Config";
import BasicForm from "./BasicForm";
import InitialMeasurementsForm from "./InitialMeasurementsForm";
import HealthDetailsForm from "./HealthDetailsForm";
import HabitAssessmentForm from "./HabitAssessmentForm";
import RoutineAssessmentForm from "./RoutineAssessmentForm";
import {Debugger} from "inspector";

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
const ProfileCreation = ({userData}) => {

    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(true);
    const [current, setCurrentStep] = useState(0);

    const [profileData, setProfile] = useState({});

    useEffect(() => {

        if (userData.profile_created) {
            // fetch current profile

            const fetchProfile = async () => {
                const url = BASE_URL + "/api/profile/get-profile";
                const profile = await Axios.get(url);
                setProfile(profile.data);
            }

            void fetchProfile();
        } else {
            setLoading(false);
        }

    }, []);

    const handleValidateForm = () => {
        void formRef.current?.getFormattedValues((err, values) => {
            if (!err) {
                debugger;
                setProfile({...profileData, ...values});
                next();
            } else {
                message.error("Please fix the form errors before proceeding.");
            }
        });
    };



    const next = () => {
        if (current === steps.length - 1) {
            handleOk();
        } else {
            setCurrentStep(current + 1 );
        }
    }

    const prev = () => {
        setCurrentStep(current - 1 );
    }


    const handleOk = () => {
        setLoading(true);
        debugger;
        setTimeout(() => {
            console.log(profileData);
            setLoading(false);
            setVisible(false);
        }, 3000);
    };

    const ComponentToRender = steps[current].content;
    const formRef = createRef<any>();

    return (


        <Modal
            visible={visible}
            title="Profile"
            closable={false}
            maskClosable={false}
            centered={true}
            width={'80vw'}
            bodyStyle={{height: '80vh', width: '80vw'}}
            keyboard={false}
            onOk={handleOk}
            onCancel={() => setVisible(false)}
            footer={[
                <Button onClick={prev} disabled={current === 0 || loading}>
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