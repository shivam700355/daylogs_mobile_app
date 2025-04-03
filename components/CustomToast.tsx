import React from 'react';
import Toast from 'react-native-toast-message';

const CustomToast = () => {
    return <Toast />;
};

export const showToast = (type, title, message) => {
    Toast.show({
        type: type,
        text1: title,
        text2: message,
        position: 'top',
        visibilityTime: 4000,
        autoHide: true,
        topOffset: 50,
    });
};

export default CustomToast;
