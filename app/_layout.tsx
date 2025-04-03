import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  const router = useRouter();
  console.log(router);

  useEffect(() => {
    router.replace('/Dashboard');
  }, [router]);

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#76bbd0"
        hidden={false}
      />
      <Stack >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="OtpPage" options={{ headerShown: false }} />
        <Stack.Screen name="VerifyOtp" options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="Attendance" options={{ headerShown: false }} />
        <Stack.Screen name="DailyWork" options={{ headerShown: false }} />
        <Stack.Screen name="Status" options={{ headerShown: false }} />
        <Stack.Screen name="Team" options={{ headerShown: false }} />
        <Stack.Screen name="Holidays" options={{ headerShown: false }} />
        <Stack.Screen name="Announcement" options={{ headerShown: false }} />
        <Stack.Screen name="Request" options={{ headerShown: false }} />
        <Stack.Screen name="Document" options={{ headerShown: false }} />
        <Stack.Screen name="Profile" options={{ headerShown: false }} />
        <Stack.Screen name="MyReview" options={{ headerShown: false }} />
        <Stack.Screen name="Location" options={{ headerShown: false }} />
        <Stack.Screen name="CheckInCheckOut" options={{ headerShown: false }} />
        <Stack.Screen name="Check" options={{ headerShown: false }} />
        <Stack.Screen name="test2" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}