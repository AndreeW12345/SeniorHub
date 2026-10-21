import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HttpsError } from 'firebase-functions/v2/https';

import { finalizeAccountDeletion } from '../lib/callable/delete-user-account.js';

describe('finalizeAccountDeletion', () => {
  it('A: Auth delete fail after profile removal does not return ok', async () => {
    let authDeleteCalled = false;

    await assert.rejects(
      () =>
        finalizeAccountDeletion('user1', {
          deleteAuthUser: async () => {
            authDeleteCalled = true;
            throw new HttpsError('internal', 'Auth failed');
          },
          deleteUserDocument: async () => {},
          deleteSelfAdminDocument: async () => {},
          userDocumentExists: async () => false,
        }),
      (error) => error instanceof HttpsError && error.code === 'internal',
    );

    assert.equal(authDeleteCalled, true);
  });

  it('B: users delete fail does not remove Auth or return ok', async () => {
    let authDeleteCalled = false;
    let adminDeleteCalled = false;

    await assert.rejects(
      () =>
        finalizeAccountDeletion('user1', {
          deleteAuthUser: async () => {
            authDeleteCalled = true;
          },
          deleteUserDocument: async () => {
            throw new Error('firestore delete failed');
          },
          deleteSelfAdminDocument: async () => {
            adminDeleteCalled = true;
          },
          userDocumentExists: async () => true,
        }),
      (error) => error instanceof HttpsError && error.code === 'internal',
    );

    assert.equal(authDeleteCalled, false);
    assert.equal(adminDeleteCalled, false);
  });

  it('C: profile removed and verified before self admin delete and Auth removal', async () => {
    const order = [];

    const result = await finalizeAccountDeletion('user1', {
      deleteAuthUser: async () => {
        order.push('auth');
      },
      deleteUserDocument: async () => {
        order.push('user');
      },
      deleteSelfAdminDocument: async () => {
        order.push('admin');
      },
      userDocumentExists: async () => {
        order.push('verify');
        return false;
      },
    });

    assert.deepEqual(result, { ok: true });
    assert.deepEqual(order, ['user', 'verify', 'admin', 'auth']);
  });

  it('D: full successful finalization returns ok', async () => {
    const result = await finalizeAccountDeletion('user1', {
      deleteAuthUser: async () => {},
      deleteUserDocument: async () => {},
      deleteSelfAdminDocument: async () => {},
      userDocumentExists: async () => false,
    });

    assert.deepEqual(result, { ok: true });
  });

  it('E: self admin delete does not remove other admin documents', async () => {
    const admins = {
      user1: { email: 'self@example.com', organizationId: 'org-a', role: 'admin' },
      'other-admin': { email: 'other@example.com', organizationId: 'org-b', role: 'admin' },
    };

    await finalizeAccountDeletion('user1', {
      deleteAuthUser: async () => {},
      deleteUserDocument: async () => {},
      deleteSelfAdminDocument: async (uid) => {
        delete admins[uid];
      },
      userDocumentExists: async () => false,
    });

    assert.equal(admins.user1, undefined);
    assert.ok(admins['other-admin']);
    assert.equal(admins['other-admin'].organizationId, 'org-b');
  });

  it('does not return ok when user profile still exists after deletion steps', async () => {
    let authDeleteCalled = false;

    await assert.rejects(
      () =>
        finalizeAccountDeletion('user1', {
          deleteAuthUser: async () => {
            authDeleteCalled = true;
          },
          deleteUserDocument: async () => {},
          deleteSelfAdminDocument: async () => {},
          userDocumentExists: async () => true,
        }),
      (error) => error instanceof HttpsError && error.code === 'internal',
    );

    assert.equal(authDeleteCalled, false);
  });
});
