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

export type CreateIssueMutationVariables = Exact<{
  input: Types.CreateIssueInput;
}>;


export type CreateIssueMutation = { createIssue: string | null };

export type DeleteIssueMutationVariables = Exact<{
  id: string;
}>;


export type DeleteIssueMutation = { deleteIssue: string | null };

export type FindIssueQueryVariables = Exact<{
  findIssueId: string;
}>;


export type FindIssueQuery = { findIssue: { id: string | null, description: string | null, name: string | null, statusId: string | null, priority: string | null, dueDate: unknown, project: { id: string | null, name: string | null } | null, parentIssue: { id: string | null, name: string | null } | null } | null };

export type FindProjectIssuesQueryVariables = Exact<{
  projectId: string;
}>;


export type FindProjectIssuesQuery = { findProjectIssues: Array<{ description: string | null, id: string | null, name: string | null, statusId: string | null, priority: string | null, dueDate: unknown, hasChildren: boolean | null }> | null };

export type FindSubIssuesQueryVariables = Exact<{
  input: Types.FindIssuesInput;
}>;


export type FindSubIssuesQuery = { findSubIssues: Array<{ description: string | null, id: string | null, name: string | null, dueDate: unknown, statusId: string | null, priority: string | null }> | null };

export type UpdateIssueMutationVariables = Exact<{
  input: Types.UpdateIssueInput;
}>;


export type UpdateIssueMutation = { updateIssue: string | null };

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

export const CreateIssueDocument = new TypedDocumentString(`
    mutation CreateIssue($input: CreateIssueInput!) {
  createIssue(input: $input)
}
    `);

export const useCreateIssueMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateIssueMutation, TError, CreateIssueMutationVariables, TContext>) => {
    
    return useMutation<CreateIssueMutation, TError, CreateIssueMutationVariables, TContext>(
      {
    mutationKey: ['CreateIssue'],
    mutationFn: (variables?: CreateIssueMutationVariables) => graphQLFetcher<CreateIssueMutation, CreateIssueMutationVariables>(CreateIssueDocument, variables)(),
    ...options
  }
    )};

useCreateIssueMutation.getKey = () => ['CreateIssue'];

export const DeleteIssueDocument = new TypedDocumentString(`
    mutation DeleteIssue($id: String!) {
  deleteIssue(id: $id)
}
    `);

export const useDeleteIssueMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<DeleteIssueMutation, TError, DeleteIssueMutationVariables, TContext>) => {
    
    return useMutation<DeleteIssueMutation, TError, DeleteIssueMutationVariables, TContext>(
      {
    mutationKey: ['DeleteIssue'],
    mutationFn: (variables?: DeleteIssueMutationVariables) => graphQLFetcher<DeleteIssueMutation, DeleteIssueMutationVariables>(DeleteIssueDocument, variables)(),
    ...options
  }
    )};

useDeleteIssueMutation.getKey = () => ['DeleteIssue'];

export const FindIssueDocument = new TypedDocumentString(`
    query FindIssue($findIssueId: String!) {
  findIssue(id: $findIssueId) {
    id
    description
    project {
      id
      name
    }
    parentIssue {
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

export const useFindIssueQuery = <
      TData = FindIssueQuery,
      TError = unknown
    >(
      variables: FindIssueQueryVariables,
      options?: Omit<UseQueryOptions<FindIssueQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<FindIssueQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<FindIssueQuery, TError, TData>(
      {
    queryKey: ['FindIssue', variables],
    queryFn: graphQLFetcher<FindIssueQuery, FindIssueQueryVariables>(FindIssueDocument, variables),
    ...options
  }
    )};

useFindIssueQuery.document = FindIssueDocument;

useFindIssueQuery.getKey = (variables: FindIssueQueryVariables) => ['FindIssue', variables];

export const FindProjectIssuesDocument = new TypedDocumentString(`
    query FindProjectIssues($projectId: String!) {
  findProjectIssues(projectId: $projectId) {
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

export const useFindProjectIssuesQuery = <
      TData = FindProjectIssuesQuery,
      TError = unknown
    >(
      variables: FindProjectIssuesQueryVariables,
      options?: Omit<UseQueryOptions<FindProjectIssuesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<FindProjectIssuesQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<FindProjectIssuesQuery, TError, TData>(
      {
    queryKey: ['FindProjectIssues', variables],
    queryFn: graphQLFetcher<FindProjectIssuesQuery, FindProjectIssuesQueryVariables>(FindProjectIssuesDocument, variables),
    ...options
  }
    )};

useFindProjectIssuesQuery.document = FindProjectIssuesDocument;

useFindProjectIssuesQuery.getKey = (variables: FindProjectIssuesQueryVariables) => ['FindProjectIssues', variables];

export const FindSubIssuesDocument = new TypedDocumentString(`
    query FindSubIssues($input: FindIssuesInput!) {
  findSubIssues(input: $input) {
    description
    id
    name
    dueDate
    statusId
    priority
  }
}
    `);

export const useFindSubIssuesQuery = <
      TData = FindSubIssuesQuery,
      TError = unknown
    >(
      variables: FindSubIssuesQueryVariables,
      options?: Omit<UseQueryOptions<FindSubIssuesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<FindSubIssuesQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<FindSubIssuesQuery, TError, TData>(
      {
    queryKey: ['FindSubIssues', variables],
    queryFn: graphQLFetcher<FindSubIssuesQuery, FindSubIssuesQueryVariables>(FindSubIssuesDocument, variables),
    ...options
  }
    )};

useFindSubIssuesQuery.document = FindSubIssuesDocument;

useFindSubIssuesQuery.getKey = (variables: FindSubIssuesQueryVariables) => ['FindSubIssues', variables];

export const UpdateIssueDocument = new TypedDocumentString(`
    mutation UpdateIssue($input: UpdateIssueInput!) {
  updateIssue(input: $input)
}
    `);

export const useUpdateIssueMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UpdateIssueMutation, TError, UpdateIssueMutationVariables, TContext>) => {
    
    return useMutation<UpdateIssueMutation, TError, UpdateIssueMutationVariables, TContext>(
      {
    mutationKey: ['UpdateIssue'],
    mutationFn: (variables?: UpdateIssueMutationVariables) => graphQLFetcher<UpdateIssueMutation, UpdateIssueMutationVariables>(UpdateIssueDocument, variables)(),
    ...options
  }
    )};

useUpdateIssueMutation.getKey = () => ['UpdateIssue'];

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
