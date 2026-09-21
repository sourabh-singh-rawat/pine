/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { graphQLFetcher } from '../../graphql/fetcher';
export { graphQLFetcher };
import type * as Types from './graphql';

import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
export type DeleteAttachmentMutationVariables = Exact<{
  deleteAttachmentId: string;
}>;


export type DeleteAttachmentMutation = { deleteAttachment: string | null };

export type CreateItemMutationVariables = Exact<{
  input: Types.CreateItemInput;
}>;


export type CreateItemMutation = { createItem: string | null };

export type DeleteItemMutationVariables = Exact<{
  id: string;
}>;


export type DeleteItemMutation = { deleteItem: string | null };

export type GetAuditLogsQueryVariables = Exact<{
  entityType: string;
  entityId: string;
  workspaceId: string;
}>;


export type GetAuditLogsQuery = { getAuditLogs: Array<{ id: string | null, entityType: string | null, entityId: string | null, action: string | null, actorId: string | null, workspaceId: string | null, createdAt: unknown }> | null };

export type GetItemQueryVariables = Exact<{
  id: string;
}>;


export type GetItemQuery = { getItem: { id: string | null, description: string | null, name: string | null, statusId: string | null, priority: string | null, dueDate: unknown, project: { id: string | null, name: string | null } | null, parentItem: { id: string | null, name: string | null } | null } | null };

export type GetProjectItemsQueryVariables = Exact<{
  projectId: string;
}>;


export type GetProjectItemsQuery = { getProjectItems: Array<{ description: string | null, id: string | null, name: string | null, statusId: string | null, priority: string | null, dueDate: unknown, hasChildren: boolean | null }> | null };

export type GetSubItemsQueryVariables = Exact<{
  input: Types.GetSubItemsInput;
}>;


export type GetSubItemsQuery = { getSubItems: Array<{ description: string | null, id: string | null, name: string | null, dueDate: unknown, statusId: string | null, priority: string | null }> | null };

export type UpdateItemMutationVariables = Exact<{
  input: Types.UpdateItemInput;
}>;


export type UpdateItemMutation = { updateItem: string | null };

export type CreateProjectMutationVariables = Exact<{
  input: Types.CreateProjectInput;
}>;


export type CreateProjectMutation = { createProject: string | null };

export type FindProjectQueryVariables = Exact<{
  findProjectId: string;
}>;


export type FindProjectQuery = { findProject: { id: string | null, spaceId: string | null, name: string | null } | null };

export type FindProjectsQueryVariables = Exact<{
  spaceId: string;
}>;


export type FindProjectsQuery = { findProjects: { rowCount: number | null, rows: Array<{ id: string | null, spaceId: string | null, name: string | null }> | null } | null };

export type FindStatusesQueryVariables = Exact<{
  input: Types.FindStatusesOptions;
}>;


export type FindStatusesQuery = { findStatuses: Array<{ id: string | null, name: string | null }> | null };

export type CreateSpaceMutationVariables = Exact<{
  input: Types.CreateSpaceInput;
}>;


export type CreateSpaceMutation = { createSpace: { id: string | null, workspaceId: string | null, name: string | null, createdById: string | null, createdAt: unknown, updatedAt: unknown } | null };

export type GetSpacesQueryVariables = Exact<{
  workspaceId: string;
}>;


export type GetSpacesQuery = { getSpaces: Array<{ id: string | null, workspaceId: string | null, name: string | null, createdById: string | null, createdAt: unknown, updatedAt: unknown }> | null };

export type GetMyWorkspacePreferenceQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyWorkspacePreferenceQuery = { getMyWorkspacePreference: { workspaceId: string | null, tenantId: string | null, updatedAt: unknown } | null };

export type GetMyWorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyWorkspacesQuery = { getMyWorkspaces: Array<{ id: string | null, tenantId: string | null, parentWorkspaceId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, createdAt: unknown, children: Array<{ id: string | null, tenantId: string | null, parentWorkspaceId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, createdAt: unknown, children: Array<{ id: string | null, tenantId: string | null, parentWorkspaceId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, createdAt: unknown, children: Array<{ id: string | null, tenantId: string | null, parentWorkspaceId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, createdAt: unknown, children: Array<{ id: string | null, tenantId: string | null, parentWorkspaceId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, createdAt: unknown, children: Array<{ id: string | null, tenantId: string | null, parentWorkspaceId: string | null, name: string | null, slug: string | null, description: string | null, isActive: boolean | null, createdAt: unknown }> | null }> | null }> | null }> | null }> | null }> | null };

export type SetMyWorkspacePreferenceMutationVariables = Exact<{
  workspaceId: string;
}>;


export type SetMyWorkspacePreferenceMutation = { setMyWorkspacePreference: { workspaceId: string | null, tenantId: string | null, updatedAt: unknown } | null };


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

export const DeleteAttachmentDocument = new TypedDocumentString(`
    mutation DeleteAttachment($deleteAttachmentId: String!) {
  deleteAttachment(id: $deleteAttachmentId)
}
    `);

export const useDeleteAttachmentMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<DeleteAttachmentMutation, TError, DeleteAttachmentMutationVariables, TContext>) => {
    
    return useMutation<DeleteAttachmentMutation, TError, DeleteAttachmentMutationVariables, TContext>(
      {
    mutationKey: ['DeleteAttachment'],
    mutationFn: (variables?: DeleteAttachmentMutationVariables) => graphQLFetcher<DeleteAttachmentMutation, DeleteAttachmentMutationVariables>(DeleteAttachmentDocument, variables)(),
    ...options
  }
    )};

useDeleteAttachmentMutation.getKey = () => ['DeleteAttachment'];

export const CreateItemDocument = new TypedDocumentString(`
    mutation CreateItem($input: CreateItemInput!) {
  createItem(input: $input)
}
    `);

export const useCreateItemMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateItemMutation, TError, CreateItemMutationVariables, TContext>) => {
    
    return useMutation<CreateItemMutation, TError, CreateItemMutationVariables, TContext>(
      {
    mutationKey: ['CreateItem'],
    mutationFn: (variables?: CreateItemMutationVariables) => graphQLFetcher<CreateItemMutation, CreateItemMutationVariables>(CreateItemDocument, variables)(),
    ...options
  }
    )};

useCreateItemMutation.getKey = () => ['CreateItem'];

export const DeleteItemDocument = new TypedDocumentString(`
    mutation DeleteItem($id: String!) {
  deleteItem(id: $id)
}
    `);

export const useDeleteItemMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<DeleteItemMutation, TError, DeleteItemMutationVariables, TContext>) => {
    
    return useMutation<DeleteItemMutation, TError, DeleteItemMutationVariables, TContext>(
      {
    mutationKey: ['DeleteItem'],
    mutationFn: (variables?: DeleteItemMutationVariables) => graphQLFetcher<DeleteItemMutation, DeleteItemMutationVariables>(DeleteItemDocument, variables)(),
    ...options
  }
    )};

useDeleteItemMutation.getKey = () => ['DeleteItem'];

export const GetAuditLogsDocument = new TypedDocumentString(`
    query GetAuditLogs($entityType: String!, $entityId: String!, $workspaceId: String!) {
  getAuditLogs(
    entityType: $entityType
    entityId: $entityId
    workspaceId: $workspaceId
  ) {
    id
    entityType
    entityId
    action
    actorId
    workspaceId
    createdAt
  }
}
    `);

export const useGetAuditLogsQuery = <
      TData = GetAuditLogsQuery,
      TError = unknown
    >(
      variables: GetAuditLogsQueryVariables,
      options?: Omit<UseQueryOptions<GetAuditLogsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetAuditLogsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetAuditLogsQuery, TError, TData>(
      {
    queryKey: ['GetAuditLogs', variables],
    queryFn: graphQLFetcher<GetAuditLogsQuery, GetAuditLogsQueryVariables>(GetAuditLogsDocument, variables),
    ...options
  }
    )};

useGetAuditLogsQuery.document = GetAuditLogsDocument;

useGetAuditLogsQuery.getKey = (variables: GetAuditLogsQueryVariables) => ['GetAuditLogs', variables];

export const GetItemDocument = new TypedDocumentString(`
    query GetItem($id: String!) {
  getItem(id: $id) {
    id
    description
    project {
      id
      name
    }
    parentItem {
      id
      name
    }
    name
    statusId
    priority
    dueDate
  }
}
    `);

export const useGetItemQuery = <
      TData = GetItemQuery,
      TError = unknown
    >(
      variables: GetItemQueryVariables,
      options?: Omit<UseQueryOptions<GetItemQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetItemQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetItemQuery, TError, TData>(
      {
    queryKey: ['GetItem', variables],
    queryFn: graphQLFetcher<GetItemQuery, GetItemQueryVariables>(GetItemDocument, variables),
    ...options
  }
    )};

useGetItemQuery.document = GetItemDocument;

useGetItemQuery.getKey = (variables: GetItemQueryVariables) => ['GetItem', variables];

export const GetProjectItemsDocument = new TypedDocumentString(`
    query GetProjectItems($projectId: String!) {
  getProjectItems(projectId: $projectId) {
    description
    id
    name
    statusId
    priority
    dueDate
    hasChildren
  }
}
    `);

export const useGetProjectItemsQuery = <
      TData = GetProjectItemsQuery,
      TError = unknown
    >(
      variables: GetProjectItemsQueryVariables,
      options?: Omit<UseQueryOptions<GetProjectItemsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetProjectItemsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetProjectItemsQuery, TError, TData>(
      {
    queryKey: ['GetProjectItems', variables],
    queryFn: graphQLFetcher<GetProjectItemsQuery, GetProjectItemsQueryVariables>(GetProjectItemsDocument, variables),
    ...options
  }
    )};

useGetProjectItemsQuery.document = GetProjectItemsDocument;

useGetProjectItemsQuery.getKey = (variables: GetProjectItemsQueryVariables) => ['GetProjectItems', variables];

export const GetSubItemsDocument = new TypedDocumentString(`
    query GetSubItems($input: GetSubItemsInput!) {
  getSubItems(input: $input) {
    description
    id
    name
    dueDate
    statusId
    priority
  }
}
    `);

export const useGetSubItemsQuery = <
      TData = GetSubItemsQuery,
      TError = unknown
    >(
      variables: GetSubItemsQueryVariables,
      options?: Omit<UseQueryOptions<GetSubItemsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetSubItemsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetSubItemsQuery, TError, TData>(
      {
    queryKey: ['GetSubItems', variables],
    queryFn: graphQLFetcher<GetSubItemsQuery, GetSubItemsQueryVariables>(GetSubItemsDocument, variables),
    ...options
  }
    )};

useGetSubItemsQuery.document = GetSubItemsDocument;

useGetSubItemsQuery.getKey = (variables: GetSubItemsQueryVariables) => ['GetSubItems', variables];

export const UpdateItemDocument = new TypedDocumentString(`
    mutation UpdateItem($input: UpdateItemInput!) {
  updateItem(input: $input)
}
    `);

export const useUpdateItemMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UpdateItemMutation, TError, UpdateItemMutationVariables, TContext>) => {
    
    return useMutation<UpdateItemMutation, TError, UpdateItemMutationVariables, TContext>(
      {
    mutationKey: ['UpdateItem'],
    mutationFn: (variables?: UpdateItemMutationVariables) => graphQLFetcher<UpdateItemMutation, UpdateItemMutationVariables>(UpdateItemDocument, variables)(),
    ...options
  }
    )};

useUpdateItemMutation.getKey = () => ['UpdateItem'];

export const CreateProjectDocument = new TypedDocumentString(`
    mutation CreateProject($input: CreateProjectInput!) {
  createProject(input: $input)
}
    `);

export const useCreateProjectMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateProjectMutation, TError, CreateProjectMutationVariables, TContext>) => {
    
    return useMutation<CreateProjectMutation, TError, CreateProjectMutationVariables, TContext>(
      {
    mutationKey: ['CreateProject'],
    mutationFn: (variables?: CreateProjectMutationVariables) => graphQLFetcher<CreateProjectMutation, CreateProjectMutationVariables>(CreateProjectDocument, variables)(),
    ...options
  }
    )};

useCreateProjectMutation.getKey = () => ['CreateProject'];

export const FindProjectDocument = new TypedDocumentString(`
    query FindProject($findProjectId: String!) {
  findProject(id: $findProjectId) {
    id
    spaceId
    name
  }
}
    `);

export const useFindProjectQuery = <
      TData = FindProjectQuery,
      TError = unknown
    >(
      variables: FindProjectQueryVariables,
      options?: Omit<UseQueryOptions<FindProjectQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<FindProjectQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<FindProjectQuery, TError, TData>(
      {
    queryKey: ['FindProject', variables],
    queryFn: graphQLFetcher<FindProjectQuery, FindProjectQueryVariables>(FindProjectDocument, variables),
    ...options
  }
    )};

useFindProjectQuery.document = FindProjectDocument;

useFindProjectQuery.getKey = (variables: FindProjectQueryVariables) => ['FindProject', variables];

export const FindProjectsDocument = new TypedDocumentString(`
    query FindProjects($spaceId: String!) {
  findProjects(spaceId: $spaceId) {
    rows {
      id
      spaceId
      name
    }
    rowCount
  }
}
    `);

export const useFindProjectsQuery = <
      TData = FindProjectsQuery,
      TError = unknown
    >(
      variables: FindProjectsQueryVariables,
      options?: Omit<UseQueryOptions<FindProjectsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<FindProjectsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<FindProjectsQuery, TError, TData>(
      {
    queryKey: ['FindProjects', variables],
    queryFn: graphQLFetcher<FindProjectsQuery, FindProjectsQueryVariables>(FindProjectsDocument, variables),
    ...options
  }
    )};

useFindProjectsQuery.document = FindProjectsDocument;

useFindProjectsQuery.getKey = (variables: FindProjectsQueryVariables) => ['FindProjects', variables];

export const FindStatusesDocument = new TypedDocumentString(`
    query FindStatuses($input: FindStatusesOptions!) {
  findStatuses(input: $input) {
    id
    name
  }
}
    `);

export const useFindStatusesQuery = <
      TData = FindStatusesQuery,
      TError = unknown
    >(
      variables: FindStatusesQueryVariables,
      options?: Omit<UseQueryOptions<FindStatusesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<FindStatusesQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<FindStatusesQuery, TError, TData>(
      {
    queryKey: ['FindStatuses', variables],
    queryFn: graphQLFetcher<FindStatusesQuery, FindStatusesQueryVariables>(FindStatusesDocument, variables),
    ...options
  }
    )};

useFindStatusesQuery.document = FindStatusesDocument;

useFindStatusesQuery.getKey = (variables: FindStatusesQueryVariables) => ['FindStatuses', variables];

export const CreateSpaceDocument = new TypedDocumentString(`
    mutation CreateSpace($input: CreateSpaceInput!) {
  createSpace(input: $input) {
    id
    workspaceId
    name
    createdById
    createdAt
    updatedAt
  }
}
    `);

export const useCreateSpaceMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateSpaceMutation, TError, CreateSpaceMutationVariables, TContext>) => {
    
    return useMutation<CreateSpaceMutation, TError, CreateSpaceMutationVariables, TContext>(
      {
    mutationKey: ['CreateSpace'],
    mutationFn: (variables?: CreateSpaceMutationVariables) => graphQLFetcher<CreateSpaceMutation, CreateSpaceMutationVariables>(CreateSpaceDocument, variables)(),
    ...options
  }
    )};

useCreateSpaceMutation.getKey = () => ['CreateSpace'];

export const GetSpacesDocument = new TypedDocumentString(`
    query GetSpaces($workspaceId: String!) {
  getSpaces(workspaceId: $workspaceId) {
    id
    workspaceId
    name
    createdById
    createdAt
    updatedAt
  }
}
    `);

export const useGetSpacesQuery = <
      TData = GetSpacesQuery,
      TError = unknown
    >(
      variables: GetSpacesQueryVariables,
      options?: Omit<UseQueryOptions<GetSpacesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetSpacesQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetSpacesQuery, TError, TData>(
      {
    queryKey: ['GetSpaces', variables],
    queryFn: graphQLFetcher<GetSpacesQuery, GetSpacesQueryVariables>(GetSpacesDocument, variables),
    ...options
  }
    )};

useGetSpacesQuery.document = GetSpacesDocument;

useGetSpacesQuery.getKey = (variables: GetSpacesQueryVariables) => ['GetSpaces', variables];

export const GetMyWorkspacePreferenceDocument = new TypedDocumentString(`
    query GetMyWorkspacePreference {
  getMyWorkspacePreference {
    workspaceId
    tenantId
    updatedAt
  }
}
    `);

export const useGetMyWorkspacePreferenceQuery = <
      TData = GetMyWorkspacePreferenceQuery,
      TError = unknown
    >(
      variables?: GetMyWorkspacePreferenceQueryVariables,
      options?: Omit<UseQueryOptions<GetMyWorkspacePreferenceQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetMyWorkspacePreferenceQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetMyWorkspacePreferenceQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetMyWorkspacePreference'] : ['GetMyWorkspacePreference', variables],
    queryFn: graphQLFetcher<GetMyWorkspacePreferenceQuery, GetMyWorkspacePreferenceQueryVariables>(GetMyWorkspacePreferenceDocument, variables),
    ...options
  }
    )};

useGetMyWorkspacePreferenceQuery.document = GetMyWorkspacePreferenceDocument;

useGetMyWorkspacePreferenceQuery.getKey = (variables?: GetMyWorkspacePreferenceQueryVariables) => variables === undefined ? ['GetMyWorkspacePreference'] : ['GetMyWorkspacePreference', variables];

export const GetMyWorkspacesDocument = new TypedDocumentString(`
    query GetMyWorkspaces {
  getMyWorkspaces {
    id
    tenantId
    parentWorkspaceId
    name
    slug
    description
    isActive
    createdAt
    children {
      id
      tenantId
      parentWorkspaceId
      name
      slug
      description
      isActive
      createdAt
      children {
        id
        tenantId
        parentWorkspaceId
        name
        slug
        description
        isActive
        createdAt
        children {
          id
          tenantId
          parentWorkspaceId
          name
          slug
          description
          isActive
          createdAt
          children {
            id
            tenantId
            parentWorkspaceId
            name
            slug
            description
            isActive
            createdAt
            children {
              id
              tenantId
              parentWorkspaceId
              name
              slug
              description
              isActive
              createdAt
            }
          }
        }
      }
    }
  }
}
    `);

export const useGetMyWorkspacesQuery = <
      TData = GetMyWorkspacesQuery,
      TError = unknown
    >(
      variables?: GetMyWorkspacesQueryVariables,
      options?: Omit<UseQueryOptions<GetMyWorkspacesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetMyWorkspacesQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetMyWorkspacesQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetMyWorkspaces'] : ['GetMyWorkspaces', variables],
    queryFn: graphQLFetcher<GetMyWorkspacesQuery, GetMyWorkspacesQueryVariables>(GetMyWorkspacesDocument, variables),
    ...options
  }
    )};

useGetMyWorkspacesQuery.document = GetMyWorkspacesDocument;

useGetMyWorkspacesQuery.getKey = (variables?: GetMyWorkspacesQueryVariables) => variables === undefined ? ['GetMyWorkspaces'] : ['GetMyWorkspaces', variables];

export const SetMyWorkspacePreferenceDocument = new TypedDocumentString(`
    mutation SetMyWorkspacePreference($workspaceId: String!) {
  setMyWorkspacePreference(workspaceId: $workspaceId) {
    workspaceId
    tenantId
    updatedAt
  }
}
    `);

export const useSetMyWorkspacePreferenceMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<SetMyWorkspacePreferenceMutation, TError, SetMyWorkspacePreferenceMutationVariables, TContext>) => {
    
    return useMutation<SetMyWorkspacePreferenceMutation, TError, SetMyWorkspacePreferenceMutationVariables, TContext>(
      {
    mutationKey: ['SetMyWorkspacePreference'],
    mutationFn: (variables?: SetMyWorkspacePreferenceMutationVariables) => graphQLFetcher<SetMyWorkspacePreferenceMutation, SetMyWorkspacePreferenceMutationVariables>(SetMyWorkspacePreferenceDocument, variables)(),
    ...options
  }
    )};

useSetMyWorkspacePreferenceMutation.getKey = () => ['SetMyWorkspacePreference'];
