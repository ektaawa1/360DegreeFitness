interface User {
    id: string;
    name: string;
    username: string;
}

interface UserData {
    token: string | undefined;
    user: User | undefined;
    profile_created: boolean;
    profile_completed: boolean;
}

interface UserContextType {
    userData: UserData;
    setUserData: (userData: UserData) => void;
}

declare const UserContext: React.Context<UserContextType>;
export default UserContext; 