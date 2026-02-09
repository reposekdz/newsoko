import { useState } from 'react';

interface BiometricCredential {
  id: string;
  credentialId: string;
  publicKey: string;
  deviceName: string;
  deviceType: 'fingerprint' | 'face_id' | 'windows_hello';
}

export const useBiometricAuth = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const checkSupport = () => {
    const supported = window.PublicKeyCredential !== undefined;
    setIsSupported(supported);
    return supported;
  };

  const registerBiometric = async (userId: number, deviceName: string) => {
    if (!checkSupport()) throw new Error('Biometric not supported');

    setIsRegistering(true);
    try {
      const challengeResponse = await fetch('/api/biometric/register-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const { challenge, userId: userIdBytes } = await challengeResponse.json();

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
          rp: { name: 'Newsoko', id: window.location.hostname },
          user: {
            id: Uint8Array.from(userIdBytes, (c: number) => c),
            name: `user_${userId}`,
            displayName: deviceName
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000
        }
      }) as PublicKeyCredential;

      const response = credential.response as AuthenticatorAttestationResponse;
      const result = await fetch('/api/biometric/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          credential_id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          public_key: btoa(String.fromCharCode(...new Uint8Array(response.getPublicKey()!))),
          device_name: deviceName
        })
      });

      setIsRegistering(false);
      return await result.json();
    } catch (error) {
      setIsRegistering(false);
      throw error;
    }
  };

  const authenticateBiometric = async (userId: number) => {
    if (!checkSupport()) throw new Error('Biometric not supported');

    setIsAuthenticating(true);
    try {
      const challengeResponse = await fetch('/api/biometric/auth-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const { challenge, credentials } = await challengeResponse.json();

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
          allowCredentials: credentials.map((cred: any) => ({
            id: Uint8Array.from(atob(cred.credential_id), c => c.charCodeAt(0)),
            type: 'public-key'
          })),
          timeout: 60000
        }
      }) as PublicKeyCredential;

      const response = assertion.response as AuthenticatorAssertionResponse;
      const result = await fetch('/api/biometric/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          credential_id: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
          signature: btoa(String.fromCharCode(...new Uint8Array(response.signature)))
        })
      });

      setIsAuthenticating(false);
      return await result.json();
    } catch (error) {
      setIsAuthenticating(false);
      throw error;
    }
  };

  return { isSupported, isRegistering, isAuthenticating, checkSupport, registerBiometric, authenticateBiometric };
};
