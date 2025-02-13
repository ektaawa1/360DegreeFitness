import React, {useEffect, useState} from "react";
import {Modal, Steps, Button, message, Progress} from 'antd';
import Axios from "axios";
import {BASE_URL} from "../../config/Config";

const { Step } = Steps;

const steps = [
    {
        title: 'User Details',
        content: 'First-content',
    },
    {
        title: 'Initial Measurements',
        content: 'Second-content',
    },
    {
        title: 'Health Details',
        content: 'Third-content',
    },
    {
        title: 'Habits',
        content: 'Fourth-content',
    },
    {
        title: 'Routine',
        content: 'Last-content',
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


    const next = () => {
        setCurrentStep(current + 1 );
    }

    const prev = () => {
        setCurrentStep(current - 1 );
    }


    const handleOk = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setVisible(false);
        }, 3000);
    };


    return (


        <Modal
            visible={visible}
            title="Title"
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
                <Button type="primary" onClick={next} disabled={loading}>
                    Next
                </Button>,
                <Button key="submit" type="primary" onClick={handleOk} disabled={current !== 4 || loading}>
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
                {loading ? <Progress /> : <div className="steps-content">{steps[current].content}</div>}

            </div>
        </Modal>

    );

}

export default ProfileCreation;