/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { graphQLFetcher } from '../../graphql/fetcher';
export { graphQLFetcher };
import type * as Types from './graphql';

import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
export type FindIdentitiesQueryVariables = Exact<{ [key: string]: never; }>;


export type FindIdentitiesQuery = { findIdentities: Array<{ id: string | null }> | null };

export type GetIdentitiesQueryVariables = Exact<{
  platformId: string;
}>;


export type GetIdentitiesQuery = { getIdentities: Array<{ id: string | null, displayName: string | null }> | null };

export type CreateOrganizationTypeMutationVariables = Exact<{
  input: Types.CreateOrganizationTypeInput;
}>;


export type CreateOrganizationTypeMutation = { createOrganizationType: { id: string | null, tenantId: string | null, parentOrganizationTypeId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null } | null };

export type GetOrganizationTypesQueryVariables = Exact<{
  tenantId: string;
}>;


export type GetOrganizationTypesQuery = { getOrganizationTypes: Array<{ id: string | null, tenantId: string | null, parentOrganizationTypeId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null }> | null };

export type CreateOrganizationMutationVariables = Exact<{
  input: Types.CreateOrganizationInput;
}>;


export type CreateOrganizationMutation = { createOrganization: { id: string | null, tenantId: string | null, parentOrganizationId: string | null, organizationTypeId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, createdAt: unknown, updatedAt: unknown } | null };

export type CreateOrganizationMemberMutationVariables = Exact<{
  input: Types.CreateOrganizationMemberInput;
}>;


export type CreateOrganizationMemberMutation = { createOrganizationMember: { id: string | null, organizationId: string | null, identityId: string | null, role: string | null, createdAt: unknown } | null };

export type DeleteOrganizationMemberMutationVariables = Exact<{
  id: string;
}>;


export type DeleteOrganizationMemberMutation = { deleteOrganizationMember: boolean | null };

export type GetOrganizationQueryVariables = Exact<{
  id: string;
}>;


export type GetOrganizationQuery = { getOrganization: { id: string | null, tenantId: string | null, parentOrganizationId: string | null, organizationTypeId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, createdAt: unknown, updatedAt: unknown } | null };

export type GetOrganizationMembersQueryVariables = Exact<{
  organizationId: string;
}>;


export type GetOrganizationMembersQuery = { getOrganizationMembers: Array<{ id: string | null, organizationId: string | null, identityId: string | null, role: string | null, createdAt: unknown, updatedAt: unknown }> | null };

export type GetOrganizationsQueryVariables = Exact<{
  tenantId: string;
  parentOrganizationId?: string | null | undefined;
}>;


export type GetOrganizationsQuery = { getOrganizations: Array<{ id: string | null, tenantId: string | null, parentOrganizationId: string | null, organizationTypeId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, createdAt: unknown, updatedAt: unknown }> | null };

export type UpdateOrganizationMutationVariables = Exact<{
  id: string;
  input: Types.UpdateOrganizationInput;
}>;


export type UpdateOrganizationMutation = { updateOrganization: { id: string | null, tenantId: string | null, parentOrganizationId: string | null, organizationTypeId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, createdAt: unknown, updatedAt: unknown } | null };

export type CreatePlatformRelationMutationVariables = Exact<{
  input: Types.CreatePlatformRelationInput;
}>;


export type CreatePlatformRelationMutation = { createPlatformRelation: { id: string | null, identityId: string | null, relation: string | null } | null };

export type DeletePlatformRelationMutationVariables = Exact<{
  id: string;
}>;


export type DeletePlatformRelationMutation = { deletePlatformRelation: string | null };

export type GetIdentityRelationsQueryVariables = Exact<{
  identityId: string;
}>;


export type GetIdentityRelationsQuery = { getIdentityRelations: { identityId: string | null, platform: Array<{ id: string | null, identityId: string | null, relation: string | null }> | null, tenants: Array<{ id: string | null, tenantId: string | null, identityId: string | null, relation: string | null }> | null, organizations: Array<{ id: string | null, organizationId: string | null, identityId: string | null, relation: string | null }> | null } | null };

export type GetPlatformRelationsQueryVariables = Exact<{
  relation?: string | null | undefined;
  identityId?: string | null | undefined;
}>;


export type GetPlatformRelationsQuery = { getPlatformRelations: Array<{ id: string | null, identityId: string | null, relation: string | null }> | null };

export type CreateSectionMutationVariables = Exact<{
  input: Types.CreateSectionInput;
}>;


export type CreateSectionMutation = { createSection: { id: string | null, tenantId: string | null, organizationId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null } | null };

export type GetSectionsQueryVariables = Exact<{
  organizationId: string;
}>;


export type GetSectionsQuery = { getSections: Array<{ id: string | null, tenantId: string | null, organizationId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null }> | null };

export type CreateTenantMemberMutationVariables = Exact<{
  input: Types.CreateTenantMemberInput;
}>;


export type CreateTenantMemberMutation = { createTenantMember: { id: string | null, tenantId: string | null, identityId: string | null, role: string | null, createdAt: unknown } | null };

export type DeleteTenantMemberMutationVariables = Exact<{
  id: string;
}>;


export type DeleteTenantMemberMutation = { deleteTenantMember: boolean | null };

export type GetTenantMembersQueryVariables = Exact<{
  tenantId: string;
}>;


export type GetTenantMembersQuery = { getTenantMembers: Array<{ id: string | null, tenantId: string | null, identityId: string | null, role: string | null, createdAt: unknown, updatedAt: unknown }> | null };

export type UpdateTenantMemberRoleMutationVariables = Exact<{
  input: Types.UpdateTenantMemberRoleInput;
}>;


export type UpdateTenantMemberRoleMutation = { updateTenantMemberRole: { id: string | null, tenantId: string | null, identityId: string | null, role: string | null, updatedAt: unknown } | null };

export type CreateTenantMutationVariables = Exact<{
  input: Types.CreateTenantInput;
}>;


export type CreateTenantMutation = { createTenant: { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, createdAt: unknown, updatedAt: unknown } | null };

export type DeleteTenantMutationVariables = Exact<{
  id: string;
  platformId: string;
}>;


export type DeleteTenantMutation = { deleteTenant: string | null };

export type GetTenantQueryVariables = Exact<{
  id: string;
}>;


export type GetTenantQuery = { getTenant: { id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, createdAt: unknown, updatedAt: unknown } | null };

export type GetTenantsQueryVariables = Exact<{
  platformId: string;
}>;


export type GetTenantsQuery = { getTenants: Array<{ id: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, createdAt: unknown, updatedAt: unknown }> | null };


export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const FindIdentitiesDocument = new TypedDocumentString(`
    query FindIdentities {
  findIdentities {
    id
  }
}
    `);

export const useFindIdentitiesQuery = <
      TData = FindIdentitiesQuery,
      TError = unknown
    >(
      variables?: FindIdentitiesQueryVariables,
      options?: Omit<UseQueryOptions<FindIdentitiesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<FindIdentitiesQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<FindIdentitiesQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['FindIdentities'] : ['FindIdentities', variables],
    queryFn: graphQLFetcher<FindIdentitiesQuery, FindIdentitiesQueryVariables>(FindIdentitiesDocument, variables),
    ...options
  }
    )};

useFindIdentitiesQuery.document = FindIdentitiesDocument;

useFindIdentitiesQuery.getKey = (variables?: FindIdentitiesQueryVariables) => variables === undefined ? ['FindIdentities'] : ['FindIdentities', variables];

export const GetIdentitiesDocument = new TypedDocumentString(`
    query GetIdentities($platformId: String!) {
  getIdentities(platformId: $platformId) {
    id
    displayName
  }
}
    `);

export const useGetIdentitiesQuery = <
      TData = GetIdentitiesQuery,
      TError = unknown
    >(
      variables: GetIdentitiesQueryVariables,
      options?: Omit<UseQueryOptions<GetIdentitiesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetIdentitiesQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetIdentitiesQuery, TError, TData>(
      {
    queryKey: ['GetIdentities', variables],
    queryFn: graphQLFetcher<GetIdentitiesQuery, GetIdentitiesQueryVariables>(GetIdentitiesDocument, variables),
    ...options
  }
    )};

useGetIdentitiesQuery.document = GetIdentitiesDocument;

useGetIdentitiesQuery.getKey = (variables: GetIdentitiesQueryVariables) => ['GetIdentities', variables];

export const CreateOrganizationTypeDocument = new TypedDocumentString(`
    mutation CreateOrganizationType($input: CreateOrganizationTypeInput!) {
  createOrganizationType(input: $input) {
    id
    tenantId
    parentOrganizationTypeId
    name
    slug
    description
    isActive
  }
}
    `);

export const useCreateOrganizationTypeMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateOrganizationTypeMutation, TError, CreateOrganizationTypeMutationVariables, TContext>) => {
    
    return useMutation<CreateOrganizationTypeMutation, TError, CreateOrganizationTypeMutationVariables, TContext>(
      {
    mutationKey: ['CreateOrganizationType'],
    mutationFn: (variables?: CreateOrganizationTypeMutationVariables) => graphQLFetcher<CreateOrganizationTypeMutation, CreateOrganizationTypeMutationVariables>(CreateOrganizationTypeDocument, variables)(),
    ...options
  }
    )};

useCreateOrganizationTypeMutation.getKey = () => ['CreateOrganizationType'];

export const GetOrganizationTypesDocument = new TypedDocumentString(`
    query GetOrganizationTypes($tenantId: String!) {
  getOrganizationTypes(tenantId: $tenantId) {
    id
    tenantId
    parentOrganizationTypeId
    name
    slug
    description
    isActive
  }
}
    `);

export const useGetOrganizationTypesQuery = <
      TData = GetOrganizationTypesQuery,
      TError = unknown
    >(
      variables: GetOrganizationTypesQueryVariables,
      options?: Omit<UseQueryOptions<GetOrganizationTypesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetOrganizationTypesQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetOrganizationTypesQuery, TError, TData>(
      {
    queryKey: ['GetOrganizationTypes', variables],
    queryFn: graphQLFetcher<GetOrganizationTypesQuery, GetOrganizationTypesQueryVariables>(GetOrganizationTypesDocument, variables),
    ...options
  }
    )};

useGetOrganizationTypesQuery.document = GetOrganizationTypesDocument;

useGetOrganizationTypesQuery.getKey = (variables: GetOrganizationTypesQueryVariables) => ['GetOrganizationTypes', variables];

export const CreateOrganizationDocument = new TypedDocumentString(`
    mutation CreateOrganization($input: CreateOrganizationInput!) {
  createOrganization(input: $input) {
    id
    tenantId
    parentOrganizationId
    organizationTypeId
    name
    slug
    description
    isActive
    createdAt
    updatedAt
  }
}
    `);

export const useCreateOrganizationMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateOrganizationMutation, TError, CreateOrganizationMutationVariables, TContext>) => {
    
    return useMutation<CreateOrganizationMutation, TError, CreateOrganizationMutationVariables, TContext>(
      {
    mutationKey: ['CreateOrganization'],
    mutationFn: (variables?: CreateOrganizationMutationVariables) => graphQLFetcher<CreateOrganizationMutation, CreateOrganizationMutationVariables>(CreateOrganizationDocument, variables)(),
    ...options
  }
    )};

useCreateOrganizationMutation.getKey = () => ['CreateOrganization'];

export const CreateOrganizationMemberDocument = new TypedDocumentString(`
    mutation CreateOrganizationMember($input: CreateOrganizationMemberInput!) {
  createOrganizationMember(input: $input) {
    id
    organizationId
    identityId
    role
    createdAt
  }
}
    `);

export const useCreateOrganizationMemberMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateOrganizationMemberMutation, TError, CreateOrganizationMemberMutationVariables, TContext>) => {
    
    return useMutation<CreateOrganizationMemberMutation, TError, CreateOrganizationMemberMutationVariables, TContext>(
      {
    mutationKey: ['CreateOrganizationMember'],
    mutationFn: (variables?: CreateOrganizationMemberMutationVariables) => graphQLFetcher<CreateOrganizationMemberMutation, CreateOrganizationMemberMutationVariables>(CreateOrganizationMemberDocument, variables)(),
    ...options
  }
    )};

useCreateOrganizationMemberMutation.getKey = () => ['CreateOrganizationMember'];

export const DeleteOrganizationMemberDocument = new TypedDocumentString(`
    mutation DeleteOrganizationMember($id: String!) {
  deleteOrganizationMember(id: $id)
}
    `);

export const useDeleteOrganizationMemberMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<DeleteOrganizationMemberMutation, TError, DeleteOrganizationMemberMutationVariables, TContext>) => {
    
    return useMutation<DeleteOrganizationMemberMutation, TError, DeleteOrganizationMemberMutationVariables, TContext>(
      {
    mutationKey: ['DeleteOrganizationMember'],
    mutationFn: (variables?: DeleteOrganizationMemberMutationVariables) => graphQLFetcher<DeleteOrganizationMemberMutation, DeleteOrganizationMemberMutationVariables>(DeleteOrganizationMemberDocument, variables)(),
    ...options
  }
    )};

useDeleteOrganizationMemberMutation.getKey = () => ['DeleteOrganizationMember'];

export const GetOrganizationDocument = new TypedDocumentString(`
    query GetOrganization($id: String!) {
  getOrganization(id: $id) {
    id
    tenantId
    parentOrganizationId
    organizationTypeId
    name
    slug
    description
    isActive
    createdAt
    updatedAt
  }
}
    `);

export const useGetOrganizationQuery = <
      TData = GetOrganizationQuery,
      TError = unknown
    >(
      variables: GetOrganizationQueryVariables,
      options?: Omit<UseQueryOptions<GetOrganizationQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetOrganizationQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetOrganizationQuery, TError, TData>(
      {
    queryKey: ['GetOrganization', variables],
    queryFn: graphQLFetcher<GetOrganizationQuery, GetOrganizationQueryVariables>(GetOrganizationDocument, variables),
    ...options
  }
    )};

useGetOrganizationQuery.document = GetOrganizationDocument;

useGetOrganizationQuery.getKey = (variables: GetOrganizationQueryVariables) => ['GetOrganization', variables];

export const GetOrganizationMembersDocument = new TypedDocumentString(`
    query GetOrganizationMembers($organizationId: String!) {
  getOrganizationMembers(organizationId: $organizationId) {
    id
    organizationId
    identityId
    role
    createdAt
    updatedAt
  }
}
    `);

export const useGetOrganizationMembersQuery = <
      TData = GetOrganizationMembersQuery,
      TError = unknown
    >(
      variables: GetOrganizationMembersQueryVariables,
      options?: Omit<UseQueryOptions<GetOrganizationMembersQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetOrganizationMembersQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetOrganizationMembersQuery, TError, TData>(
      {
    queryKey: ['GetOrganizationMembers', variables],
    queryFn: graphQLFetcher<GetOrganizationMembersQuery, GetOrganizationMembersQueryVariables>(GetOrganizationMembersDocument, variables),
    ...options
  }
    )};

useGetOrganizationMembersQuery.document = GetOrganizationMembersDocument;

useGetOrganizationMembersQuery.getKey = (variables: GetOrganizationMembersQueryVariables) => ['GetOrganizationMembers', variables];

export const GetOrganizationsDocument = new TypedDocumentString(`
    query GetOrganizations($tenantId: String!, $parentOrganizationId: String) {
  getOrganizations(
    tenantId: $tenantId
    parentOrganizationId: $parentOrganizationId
  ) {
    id
    tenantId
    parentOrganizationId
    organizationTypeId
    name
    slug
    description
    isActive
    createdAt
    updatedAt
  }
}
    `);

export const useGetOrganizationsQuery = <
      TData = GetOrganizationsQuery,
      TError = unknown
    >(
      variables: GetOrganizationsQueryVariables,
      options?: Omit<UseQueryOptions<GetOrganizationsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetOrganizationsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetOrganizationsQuery, TError, TData>(
      {
    queryKey: ['GetOrganizations', variables],
    queryFn: graphQLFetcher<GetOrganizationsQuery, GetOrganizationsQueryVariables>(GetOrganizationsDocument, variables),
    ...options
  }
    )};

useGetOrganizationsQuery.document = GetOrganizationsDocument;

useGetOrganizationsQuery.getKey = (variables: GetOrganizationsQueryVariables) => ['GetOrganizations', variables];

export const UpdateOrganizationDocument = new TypedDocumentString(`
    mutation UpdateOrganization($id: String!, $input: UpdateOrganizationInput!) {
  updateOrganization(id: $id, input: $input) {
    id
    tenantId
    parentOrganizationId
    organizationTypeId
    name
    slug
    description
    isActive
    createdAt
    updatedAt
  }
}
    `);

export const useUpdateOrganizationMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UpdateOrganizationMutation, TError, UpdateOrganizationMutationVariables, TContext>) => {
    
    return useMutation<UpdateOrganizationMutation, TError, UpdateOrganizationMutationVariables, TContext>(
      {
    mutationKey: ['UpdateOrganization'],
    mutationFn: (variables?: UpdateOrganizationMutationVariables) => graphQLFetcher<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>(UpdateOrganizationDocument, variables)(),
    ...options
  }
    )};

useUpdateOrganizationMutation.getKey = () => ['UpdateOrganization'];

export const CreatePlatformRelationDocument = new TypedDocumentString(`
    mutation CreatePlatformRelation($input: CreatePlatformRelationInput!) {
  createPlatformRelation(input: $input) {
    id
    identityId
    relation
  }
}
    `);

export const useCreatePlatformRelationMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreatePlatformRelationMutation, TError, CreatePlatformRelationMutationVariables, TContext>) => {
    
    return useMutation<CreatePlatformRelationMutation, TError, CreatePlatformRelationMutationVariables, TContext>(
      {
    mutationKey: ['CreatePlatformRelation'],
    mutationFn: (variables?: CreatePlatformRelationMutationVariables) => graphQLFetcher<CreatePlatformRelationMutation, CreatePlatformRelationMutationVariables>(CreatePlatformRelationDocument, variables)(),
    ...options
  }
    )};

useCreatePlatformRelationMutation.getKey = () => ['CreatePlatformRelation'];

export const DeletePlatformRelationDocument = new TypedDocumentString(`
    mutation DeletePlatformRelation($id: String!) {
  deletePlatformRelation(id: $id)
}
    `);

export const useDeletePlatformRelationMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<DeletePlatformRelationMutation, TError, DeletePlatformRelationMutationVariables, TContext>) => {
    
    return useMutation<DeletePlatformRelationMutation, TError, DeletePlatformRelationMutationVariables, TContext>(
      {
    mutationKey: ['DeletePlatformRelation'],
    mutationFn: (variables?: DeletePlatformRelationMutationVariables) => graphQLFetcher<DeletePlatformRelationMutation, DeletePlatformRelationMutationVariables>(DeletePlatformRelationDocument, variables)(),
    ...options
  }
    )};

useDeletePlatformRelationMutation.getKey = () => ['DeletePlatformRelation'];

export const GetIdentityRelationsDocument = new TypedDocumentString(`
    query GetIdentityRelations($identityId: String!) {
  getIdentityRelations(identityId: $identityId) {
    identityId
    platform {
      id
      identityId
      relation
    }
    tenants {
      id
      tenantId
      identityId
      relation
    }
    organizations {
      id
      organizationId
      identityId
      relation
    }
  }
}
    `);

export const useGetIdentityRelationsQuery = <
      TData = GetIdentityRelationsQuery,
      TError = unknown
    >(
      variables: GetIdentityRelationsQueryVariables,
      options?: Omit<UseQueryOptions<GetIdentityRelationsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetIdentityRelationsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetIdentityRelationsQuery, TError, TData>(
      {
    queryKey: ['GetIdentityRelations', variables],
    queryFn: graphQLFetcher<GetIdentityRelationsQuery, GetIdentityRelationsQueryVariables>(GetIdentityRelationsDocument, variables),
    ...options
  }
    )};

useGetIdentityRelationsQuery.document = GetIdentityRelationsDocument;

useGetIdentityRelationsQuery.getKey = (variables: GetIdentityRelationsQueryVariables) => ['GetIdentityRelations', variables];

export const GetPlatformRelationsDocument = new TypedDocumentString(`
    query GetPlatformRelations($relation: String, $identityId: String) {
  getPlatformRelations(relation: $relation, identityId: $identityId) {
    id
    identityId
    relation
  }
}
    `);

export const useGetPlatformRelationsQuery = <
      TData = GetPlatformRelationsQuery,
      TError = unknown
    >(
      variables?: GetPlatformRelationsQueryVariables,
      options?: Omit<UseQueryOptions<GetPlatformRelationsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetPlatformRelationsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetPlatformRelationsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetPlatformRelations'] : ['GetPlatformRelations', variables],
    queryFn: graphQLFetcher<GetPlatformRelationsQuery, GetPlatformRelationsQueryVariables>(GetPlatformRelationsDocument, variables),
    ...options
  }
    )};

useGetPlatformRelationsQuery.document = GetPlatformRelationsDocument;

useGetPlatformRelationsQuery.getKey = (variables?: GetPlatformRelationsQueryVariables) => variables === undefined ? ['GetPlatformRelations'] : ['GetPlatformRelations', variables];

export const CreateSectionDocument = new TypedDocumentString(`
    mutation CreateSection($input: CreateSectionInput!) {
  createSection(input: $input) {
    id
    tenantId
    organizationId
    name
    slug
    description
    isActive
  }
}
    `);

export const useCreateSectionMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateSectionMutation, TError, CreateSectionMutationVariables, TContext>) => {
    
    return useMutation<CreateSectionMutation, TError, CreateSectionMutationVariables, TContext>(
      {
    mutationKey: ['CreateSection'],
    mutationFn: (variables?: CreateSectionMutationVariables) => graphQLFetcher<CreateSectionMutation, CreateSectionMutationVariables>(CreateSectionDocument, variables)(),
    ...options
  }
    )};

useCreateSectionMutation.getKey = () => ['CreateSection'];

export const GetSectionsDocument = new TypedDocumentString(`
    query GetSections($organizationId: String!) {
  getSections(organizationId: $organizationId) {
    id
    tenantId
    organizationId
    name
    slug
    description
    isActive
  }
}
    `);

export const useGetSectionsQuery = <
      TData = GetSectionsQuery,
      TError = unknown
    >(
      variables: GetSectionsQueryVariables,
      options?: Omit<UseQueryOptions<GetSectionsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetSectionsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetSectionsQuery, TError, TData>(
      {
    queryKey: ['GetSections', variables],
    queryFn: graphQLFetcher<GetSectionsQuery, GetSectionsQueryVariables>(GetSectionsDocument, variables),
    ...options
  }
    )};

useGetSectionsQuery.document = GetSectionsDocument;

useGetSectionsQuery.getKey = (variables: GetSectionsQueryVariables) => ['GetSections', variables];

export const CreateTenantMemberDocument = new TypedDocumentString(`
    mutation CreateTenantMember($input: CreateTenantMemberInput!) {
  createTenantMember(input: $input) {
    id
    tenantId
    identityId
    role
    createdAt
  }
}
    `);

export const useCreateTenantMemberMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateTenantMemberMutation, TError, CreateTenantMemberMutationVariables, TContext>) => {
    
    return useMutation<CreateTenantMemberMutation, TError, CreateTenantMemberMutationVariables, TContext>(
      {
    mutationKey: ['CreateTenantMember'],
    mutationFn: (variables?: CreateTenantMemberMutationVariables) => graphQLFetcher<CreateTenantMemberMutation, CreateTenantMemberMutationVariables>(CreateTenantMemberDocument, variables)(),
    ...options
  }
    )};

useCreateTenantMemberMutation.getKey = () => ['CreateTenantMember'];

export const DeleteTenantMemberDocument = new TypedDocumentString(`
    mutation DeleteTenantMember($id: String!) {
  deleteTenantMember(id: $id)
}
    `);

export const useDeleteTenantMemberMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<DeleteTenantMemberMutation, TError, DeleteTenantMemberMutationVariables, TContext>) => {
    
    return useMutation<DeleteTenantMemberMutation, TError, DeleteTenantMemberMutationVariables, TContext>(
      {
    mutationKey: ['DeleteTenantMember'],
    mutationFn: (variables?: DeleteTenantMemberMutationVariables) => graphQLFetcher<DeleteTenantMemberMutation, DeleteTenantMemberMutationVariables>(DeleteTenantMemberDocument, variables)(),
    ...options
  }
    )};

useDeleteTenantMemberMutation.getKey = () => ['DeleteTenantMember'];

export const GetTenantMembersDocument = new TypedDocumentString(`
    query GetTenantMembers($tenantId: String!) {
  getTenantMembers(tenantId: $tenantId) {
    id
    tenantId
    identityId
    role
    createdAt
    updatedAt
  }
}
    `);

export const useGetTenantMembersQuery = <
      TData = GetTenantMembersQuery,
      TError = unknown
    >(
      variables: GetTenantMembersQueryVariables,
      options?: Omit<UseQueryOptions<GetTenantMembersQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetTenantMembersQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetTenantMembersQuery, TError, TData>(
      {
    queryKey: ['GetTenantMembers', variables],
    queryFn: graphQLFetcher<GetTenantMembersQuery, GetTenantMembersQueryVariables>(GetTenantMembersDocument, variables),
    ...options
  }
    )};

useGetTenantMembersQuery.document = GetTenantMembersDocument;

useGetTenantMembersQuery.getKey = (variables: GetTenantMembersQueryVariables) => ['GetTenantMembers', variables];

export const UpdateTenantMemberRoleDocument = new TypedDocumentString(`
    mutation UpdateTenantMemberRole($input: UpdateTenantMemberRoleInput!) {
  updateTenantMemberRole(input: $input) {
    id
    tenantId
    identityId
    role
    updatedAt
  }
}
    `);

export const useUpdateTenantMemberRoleMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UpdateTenantMemberRoleMutation, TError, UpdateTenantMemberRoleMutationVariables, TContext>) => {
    
    return useMutation<UpdateTenantMemberRoleMutation, TError, UpdateTenantMemberRoleMutationVariables, TContext>(
      {
    mutationKey: ['UpdateTenantMemberRole'],
    mutationFn: (variables?: UpdateTenantMemberRoleMutationVariables) => graphQLFetcher<UpdateTenantMemberRoleMutation, UpdateTenantMemberRoleMutationVariables>(UpdateTenantMemberRoleDocument, variables)(),
    ...options
  }
    )};

useUpdateTenantMemberRoleMutation.getKey = () => ['UpdateTenantMemberRole'];

export const CreateTenantDocument = new TypedDocumentString(`
    mutation CreateTenant($input: CreateTenantInput!) {
  createTenant(input: $input) {
    id
    name
    slug
    description
    isActive
    createdAt
    updatedAt
  }
}
    `);

export const useCreateTenantMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateTenantMutation, TError, CreateTenantMutationVariables, TContext>) => {
    
    return useMutation<CreateTenantMutation, TError, CreateTenantMutationVariables, TContext>(
      {
    mutationKey: ['CreateTenant'],
    mutationFn: (variables?: CreateTenantMutationVariables) => graphQLFetcher<CreateTenantMutation, CreateTenantMutationVariables>(CreateTenantDocument, variables)(),
    ...options
  }
    )};

useCreateTenantMutation.getKey = () => ['CreateTenant'];

export const DeleteTenantDocument = new TypedDocumentString(`
    mutation DeleteTenant($id: String!, $platformId: String!) {
  deleteTenant(id: $id, platformId: $platformId)
}
    `);

export const useDeleteTenantMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<DeleteTenantMutation, TError, DeleteTenantMutationVariables, TContext>) => {
    
    return useMutation<DeleteTenantMutation, TError, DeleteTenantMutationVariables, TContext>(
      {
    mutationKey: ['DeleteTenant'],
    mutationFn: (variables?: DeleteTenantMutationVariables) => graphQLFetcher<DeleteTenantMutation, DeleteTenantMutationVariables>(DeleteTenantDocument, variables)(),
    ...options
  }
    )};

useDeleteTenantMutation.getKey = () => ['DeleteTenant'];

export const GetTenantDocument = new TypedDocumentString(`
    query GetTenant($id: String!) {
  getTenant(id: $id) {
    id
    name
    slug
    description
    isActive
    createdAt
    updatedAt
  }
}
    `);

export const useGetTenantQuery = <
      TData = GetTenantQuery,
      TError = unknown
    >(
      variables: GetTenantQueryVariables,
      options?: Omit<UseQueryOptions<GetTenantQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetTenantQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetTenantQuery, TError, TData>(
      {
    queryKey: ['GetTenant', variables],
    queryFn: graphQLFetcher<GetTenantQuery, GetTenantQueryVariables>(GetTenantDocument, variables),
    ...options
  }
    )};

useGetTenantQuery.document = GetTenantDocument;

useGetTenantQuery.getKey = (variables: GetTenantQueryVariables) => ['GetTenant', variables];

export const GetTenantsDocument = new TypedDocumentString(`
    query GetTenants($platformId: String!) {
  getTenants(platformId: $platformId) {
    id
    name
    slug
    description
    isActive
    createdAt
    updatedAt
  }
}
    `);

export const useGetTenantsQuery = <
      TData = GetTenantsQuery,
      TError = unknown
    >(
      variables: GetTenantsQueryVariables,
      options?: Omit<UseQueryOptions<GetTenantsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetTenantsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetTenantsQuery, TError, TData>(
      {
    queryKey: ['GetTenants', variables],
    queryFn: graphQLFetcher<GetTenantsQuery, GetTenantsQueryVariables>(GetTenantsDocument, variables),
    ...options
  }
    )};

useGetTenantsQuery.document = GetTenantsDocument;

useGetTenantsQuery.getKey = (variables: GetTenantsQueryVariables) => ['GetTenants', variables];
