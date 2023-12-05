import { act, render } from '@testing-library/react'
import localforage from 'localforage'

import { PersistedStorageKeys } from 'models/storage'
import { EncryptionService } from 'services/Encryption'
import { userSettingsStubFactory } from 'test-utils/stubs/userSettings'

import { Bootstrap, BootstrapProps } from './Bootstrap'

const mockPersistedStorage =
  jest.createMockFromModule<jest.Mock<typeof localforage>>('localforage')

const mockGetItem = jest.fn()
const mockSetItem = jest.fn()

const userSettingsStub = userSettingsStubFactory()

beforeEach(() => {
  mockGetItem.mockImplementation(() => Promise.resolve(null))
  mockSetItem.mockImplementation((data: any) => Promise.resolve(data))
})

const renderBootstrap = async (overrides: Partial<BootstrapProps> = {}) => {
  Object.assign(mockPersistedStorage, {
    getItem: mockGetItem,
    setItem: mockSetItem,
  })

  render(
    <Bootstrap
      persistedStorage={mockPersistedStorage as any as typeof localforage}
      initialUserSettings={userSettingsStub}
      {...overrides}
    />
  )

  // https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning#an-alternative-waiting-for-the-mocked-promise
  await act(async () => {
    await Promise.resolve()
  })
}

test('renders', async () => {
  await renderBootstrap()
})

test('checks persistedStorage for user settings', async () => {
  await renderBootstrap()
  expect(mockGetItem).toHaveBeenCalledWith(PersistedStorageKeys.USER_SETTINGS)
})

test('persists user settings if none were already persisted', async () => {
  await renderBootstrap({
    initialUserSettings: { ...userSettingsStub, userId: 'abc123' },
  })

  expect(mockSetItem).toHaveBeenCalledWith(PersistedStorageKeys.USER_SETTINGS, {
    colorMode: 'dark',
    userId: 'abc123',
    customUsername: '',
    playSoundOnNewMessage: true,
    showNotificationOnNewMessage: true,
    showActiveTypingStatus: true,
    publicKey: EncryptionService.cryptoKeyStub,
    privateKey: EncryptionService.cryptoKeyStub,
  })
})

test('does not update user settings if they were already persisted', async () => {
  mockGetItem.mockImplementation(() => ({
    userId: 'abc123',
  }))

  await renderBootstrap()

  expect(mockSetItem).not.toHaveBeenCalled()
})
