import { api } from '@/app/api';
import type { Certificate } from '@/types';

/**
 * The API mounts certificates under `/users/me/certificates` because a
 * certificate is only ever read by its owner (or verified publicly by serial
 * number) and revoked by an admin.
 */
export const certificatesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyCertificates: builder.query<Certificate[], void>({
      query: () => ({ url: '/users/me/certificates' }),
      transformResponse: (response: Certificate[]) => response ?? [],
      providesTags: ['Certificate'],
    }),

    /** Public verification by serial number, e.g. `SB-2026-000123`. */
    verifyCertificate: builder.query<Certificate, string>({
      query: (serialNumber) => ({ url: `/users/me/certificates/verify/${serialNumber}` }),
      providesTags: ['Certificate'],
    }),

    revokeCertificate: builder.mutation<Certificate, string>({
      query: (id) => ({ url: `/users/me/certificates/${id}/revoke`, method: 'PATCH' }),
      invalidatesTags: ['Certificate'],
    }),
  }),
});

export const {
  useGetMyCertificatesQuery,
  useVerifyCertificateQuery,
  useRevokeCertificateMutation,
} = certificatesApi;
