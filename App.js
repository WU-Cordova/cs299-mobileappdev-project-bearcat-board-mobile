import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Button, Text } from 'react-native';
import { ClerkProvider, SignedIn, SignedOut, useAuth } from "@clerk/clerk-expo";
import Board from './components/Board';
import InsertEvent from './components/InsertEvent';
import { RefetchProvider } from './contexts/RefetchContext';
import SignInWithOAuth from './components/SignInWithOAuth';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';

export default function App() {

  const SignOut = () => {
    const { isLoaded, signOut } = useAuth();
    if (!isLoaded) {
      return null;
    }
    return (
      <View style={styles.signOutContainer}>
        <Button
          title="Sign Out"
          onPress={() => {
            signOut();
          }}
        />
      </View>
    );
  };

  return (
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <RefetchProvider>
        <SafeAreaView style={styles.container}>
          <SignedIn>
          <View style={styles.headerContainer}>
              <Text style={styles.title}>Bearcat Board</Text>
              <SignOut />
            </View>
            <Board/>
            <View style={styles.insertEventContainer}>
              <InsertEvent/>
            </View>
          </SignedIn>
          <SignedOut>
            <SignInWithOAuth />
          </SignedOut>
          <StatusBar style="auto" />
        </SafeAreaView>
      </RefetchProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    
  },
  headerContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 25,
    margin: 5,
  },
  insertEventContainer: {
    position: 'absolute',
    bottom: 40,
    right: 20
  },

});
