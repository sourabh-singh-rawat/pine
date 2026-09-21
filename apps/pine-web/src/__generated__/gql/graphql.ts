export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format. */
  DateTimeISO: { input: string; output: string; }
  /** A field whose value conforms to the standard internet email address format as specified in HTML Spec: https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address. */
  EmailAddress: { input: unknown; output: unknown; }
  /** A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier. */
  UUID: { input: unknown; output: unknown; }
  join__FieldSet: { input: unknown; output: unknown; }
  link__Import: { input: unknown; output: unknown; }
};

export type AuditLogObject = {
  __typename?: 'AuditLogObject';
  action?: Maybe<Scalars['String']['output']>;
  actorId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  entityId?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  tenantId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  workspaceId?: Maybe<Scalars['String']['output']>;
};

export type ClientObject = {
  __typename?: 'ClientObject';
  grantTypes?: Maybe<Array<Scalars['String']['output']>>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  redirectUris?: Maybe<Array<Scalars['String']['output']>>;
  scopes?: Maybe<Array<Scalars['String']['output']>>;
};

export type CreateClientInput = {
  grantTypes: Array<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  redirectUris?: InputMaybe<Array<Scalars['String']['input']>>;
  scopes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type CreateIdentityInput = {
  email: Scalars['String']['input'];
  emailVerified: Scalars['Boolean']['input'];
  firstName: Scalars['String']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  middleName?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type CreateIssueInput = {
  assigneeIds: Array<Scalars['String']['input']>;
  component?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTimeISO']['input']>;
  estimate?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  parentIssueId?: InputMaybe<Scalars['String']['input']>;
  priority: Scalars['String']['input'];
  projectId: Scalars['String']['input'];
  statusId: Scalars['ID']['input'];
  type: Scalars['String']['input'];
};

export type CreatePhotoUploadRequestInput = {
  contentType: Scalars['String']['input'];
  filename: Scalars['String']['input'];
  size: Scalars['Int']['input'];
};

export type CreatePlatformRelationInput = {
  identityId: Scalars['String']['input'];
  relation: Scalars['String']['input'];
};

export type CreateProfileInput = {
  firstName: Scalars['String']['input'];
  gender?: InputMaybe<ProfileGender>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  middleName?: InputMaybe<Scalars['String']['input']>;
};

export type CreateProjectInput = {
  name: Scalars['String']['input'];
  spaceId: Scalars['String']['input'];
};

export type CreateSpaceInput = {
  name: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};

export type CreateTenantInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  platformId: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type CreateTenantRelationInput = {
  identityId: Scalars['String']['input'];
  relation: Scalars['String']['input'];
  tenantId: Scalars['String']['input'];
};

export type CreateWorkspaceInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  parentWorkspaceId?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  tenantId: Scalars['String']['input'];
};

export type CreateWorkspaceRelationInput = {
  identityId: Scalars['String']['input'];
  relation: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};

export type DeleteIdentityInput = {
  identityId: Scalars['String']['input'];
};

export type FindIssuesInput = {
  parentIssueId: Scalars['String']['input'];
};

export type FindStatusesOptions = {
  projectId: Scalars['String']['input'];
};

export type HelloXyz = {
  __typename?: 'HelloXYZ';
  message?: Maybe<Scalars['String']['output']>;
  message2?: Maybe<Scalars['String']['output']>;
};

export type IdentityObject = {
  __typename?: 'IdentityObject';
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type IdentityRelationsObject = {
  __typename?: 'IdentityRelationsObject';
  identityId?: Maybe<Scalars['String']['output']>;
  platform?: Maybe<Array<PlatformRelationObject>>;
  tenants?: Maybe<Array<TenantRelationObject>>;
  workspaces?: Maybe<Array<WorkspaceRelationObject>>;
};

export type IssueObject = {
  __typename?: 'IssueObject';
  component?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['DateTimeISO']['output']>;
  estimate?: Maybe<Scalars['Int']['output']>;
  hasChildren?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  parentIssue?: Maybe<IssueObject>;
  priority?: Maybe<Scalars['String']['output']>;
  project?: Maybe<ProjectObject>;
  statusId?: Maybe<Scalars['String']['output']>;
  subIssues?: Maybe<Array<IssueObject>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createClient?: Maybe<ClientObject>;
  createIdentity?: Maybe<IdentityObject>;
  createIssue?: Maybe<Scalars['String']['output']>;
  createPhotoUploadRequest?: Maybe<PhotoUploadTargetObject>;
  createPlatformRelation?: Maybe<PlatformRelationObject>;
  createProfile?: Maybe<ProfileObject>;
  createProject?: Maybe<Scalars['String']['output']>;
  createSpace?: Maybe<SpaceObject>;
  createTenant?: Maybe<TenantObject>;
  createTenantRelation?: Maybe<TenantRelationObject>;
  createWorkspace?: Maybe<WorkspaceObject>;
  createWorkspaceRelation?: Maybe<WorkspaceRelationObject>;
  deleteAttachment?: Maybe<Scalars['String']['output']>;
  deleteClient?: Maybe<Scalars['String']['output']>;
  deleteIdentity?: Maybe<Scalars['String']['output']>;
  deleteIssue?: Maybe<Scalars['String']['output']>;
  deletePlatformRelation?: Maybe<Scalars['String']['output']>;
  deleteTenant?: Maybe<Scalars['String']['output']>;
  deleteTenantRelation?: Maybe<Scalars['Boolean']['output']>;
  deleteWorkspace?: Maybe<Scalars['String']['output']>;
  deleteWorkspaceRelation?: Maybe<Scalars['Boolean']['output']>;
  hello?: Maybe<Scalars['String']['output']>;
  setMyWorkspacePreference?: Maybe<WorkspacePreferenceObject>;
  updateIssue?: Maybe<Scalars['String']['output']>;
  updateProfileGender?: Maybe<ProfileObject>;
  updateProfileName?: Maybe<ProfileObject>;
  updateWorkspace?: Maybe<WorkspaceObject>;
};


export type MutationCreateClientArgs = {
  input: CreateClientInput;
};


export type MutationCreateIdentityArgs = {
  input: CreateIdentityInput;
};


export type MutationCreateIssueArgs = {
  input: CreateIssueInput;
};


export type MutationCreatePhotoUploadRequestArgs = {
  input: CreatePhotoUploadRequestInput;
};


export type MutationCreatePlatformRelationArgs = {
  input: CreatePlatformRelationInput;
};


export type MutationCreateProfileArgs = {
  input: CreateProfileInput;
};


export type MutationCreateProjectArgs = {
  input: CreateProjectInput;
};


export type MutationCreateSpaceArgs = {
  input: CreateSpaceInput;
};


export type MutationCreateTenantArgs = {
  input: CreateTenantInput;
};


export type MutationCreateTenantRelationArgs = {
  input: CreateTenantRelationInput;
};


export type MutationCreateWorkspaceArgs = {
  input: CreateWorkspaceInput;
};


export type MutationCreateWorkspaceRelationArgs = {
  input: CreateWorkspaceRelationInput;
};


export type MutationDeleteAttachmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteClientArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteIdentityArgs = {
  input: DeleteIdentityInput;
};


export type MutationDeleteIssueArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeletePlatformRelationArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteTenantArgs = {
  id: Scalars['String']['input'];
  platformId: Scalars['String']['input'];
};


export type MutationDeleteTenantRelationArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteWorkspaceArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteWorkspaceRelationArgs = {
  id: Scalars['String']['input'];
};


export type MutationSetMyWorkspacePreferenceArgs = {
  workspaceId: Scalars['String']['input'];
};


export type MutationUpdateIssueArgs = {
  input: UpdateIssueInput;
};


export type MutationUpdateProfileGenderArgs = {
  input: UpdateProfileGenderInput;
};


export type MutationUpdateProfileNameArgs = {
  input: UpdateProfileNameInput;
};


export type MutationUpdateWorkspaceArgs = {
  id: Scalars['String']['input'];
  input: UpdateWorkspaceInput;
};

export type PaginatedProjectObject = {
  __typename?: 'PaginatedProjectObject';
  rowCount?: Maybe<Scalars['Float']['output']>;
  rows?: Maybe<Array<ProjectObject>>;
};

export type PhotoUploadHeaderObject = {
  __typename?: 'PhotoUploadHeaderObject';
  key?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type PhotoUploadTargetObject = {
  __typename?: 'PhotoUploadTargetObject';
  expiresAt?: Maybe<Scalars['String']['output']>;
  headers?: Maybe<Array<PhotoUploadHeaderObject>>;
  uploadRequestId?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type PlatformIdentityObject = {
  __typename?: 'PlatformIdentityObject';
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type PlatformRelationObject = {
  __typename?: 'PlatformRelationObject';
  id?: Maybe<Scalars['String']['output']>;
  identityId?: Maybe<Scalars['String']['output']>;
  relation?: Maybe<Scalars['String']['output']>;
};

export type ProfileGender =
  | 'FEMALE'
  | 'MALE'
  | 'OTHER'
  | 'UNSPECIFIED';

export type ProfileObject = {
  __typename?: 'ProfileObject';
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  gender?: Maybe<ProfileGender>;
  id?: Maybe<Scalars['String']['output']>;
  identityId?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  middleName?: Maybe<Scalars['String']['output']>;
  photoUrl?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type ProjectObject = {
  __typename?: 'ProjectObject';
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  spaceId?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  attachmentServiceHealth?: Maybe<Scalars['String']['output']>;
  findIdentities?: Maybe<Array<IdentityObject>>;
  findIssue?: Maybe<IssueObject>;
  findProject?: Maybe<ProjectObject>;
  findProjectIssues?: Maybe<Array<IssueObject>>;
  findProjects?: Maybe<PaginatedProjectObject>;
  findStatuses?: Maybe<Array<StatusObject>>;
  findSubIssues?: Maybe<Array<IssueObject>>;
  getAuditLogs?: Maybe<Array<AuditLogObject>>;
  getClient?: Maybe<ClientObject>;
  getIdentities?: Maybe<Array<PlatformIdentityObject>>;
  getIdentityRelations?: Maybe<IdentityRelationsObject>;
  getMyTenants?: Maybe<Array<TenantObject>>;
  getMyWorkspacePreference?: Maybe<WorkspacePreferenceObject>;
  getMyWorkspaces?: Maybe<Array<WorkspaceObject>>;
  getPlatformRelation?: Maybe<PlatformRelationObject>;
  getPlatformRelations?: Maybe<Array<PlatformRelationObject>>;
  getSpace?: Maybe<SpaceObject>;
  getSpaces?: Maybe<Array<SpaceObject>>;
  getTenant?: Maybe<TenantObject>;
  getTenantRelation?: Maybe<TenantRelationObject>;
  getTenantRelations?: Maybe<Array<TenantRelationObject>>;
  getTenants?: Maybe<Array<TenantObject>>;
  getWorkspace?: Maybe<WorkspaceObject>;
  getWorkspaceRelation?: Maybe<WorkspaceRelationObject>;
  getWorkspaceRelations?: Maybe<Array<WorkspaceRelationObject>>;
  getWorkspaces?: Maybe<Array<WorkspaceObject>>;
  hello?: Maybe<HelloXyz>;
  hello2?: Maybe<Scalars['String']['output']>;
};


export type QueryFindIssueArgs = {
  id: Scalars['String']['input'];
};


export type QueryFindProjectArgs = {
  id: Scalars['String']['input'];
};


export type QueryFindProjectIssuesArgs = {
  projectId: Scalars['String']['input'];
};


export type QueryFindProjectsArgs = {
  spaceId: Scalars['String']['input'];
};


export type QueryFindStatusesArgs = {
  input: FindStatusesOptions;
};


export type QueryFindSubIssuesArgs = {
  input: FindIssuesInput;
};


export type QueryGetAuditLogsArgs = {
  entityId: Scalars['String']['input'];
  entityType: Scalars['String']['input'];
  workspaceId: Scalars['String']['input'];
};


export type QueryGetClientArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetIdentitiesArgs = {
  platformId: Scalars['String']['input'];
};


export type QueryGetIdentityRelationsArgs = {
  identityId: Scalars['String']['input'];
};


export type QueryGetPlatformRelationArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetPlatformRelationsArgs = {
  identityId?: InputMaybe<Scalars['String']['input']>;
  relation?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetSpaceArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetSpacesArgs = {
  workspaceId: Scalars['String']['input'];
};


export type QueryGetTenantArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetTenantRelationArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetTenantRelationsArgs = {
  identityId?: InputMaybe<Scalars['String']['input']>;
  relation?: InputMaybe<Scalars['String']['input']>;
  tenantId: Scalars['String']['input'];
};


export type QueryGetTenantsArgs = {
  platformId: Scalars['String']['input'];
};


export type QueryGetWorkspaceArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetWorkspaceRelationArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetWorkspaceRelationsArgs = {
  identityId?: InputMaybe<Scalars['String']['input']>;
  relation?: InputMaybe<Scalars['String']['input']>;
  workspaceId: Scalars['String']['input'];
};


export type QueryGetWorkspacesArgs = {
  parentWorkspaceId?: InputMaybe<Scalars['String']['input']>;
  tenantId: Scalars['String']['input'];
};

export type SpaceObject = {
  __typename?: 'SpaceObject';
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  createdById?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  workspaceId?: Maybe<Scalars['String']['output']>;
};

export type StatusObject = {
  __typename?: 'StatusObject';
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type TenantObject = {
  __typename?: 'TenantObject';
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type TenantRelationObject = {
  __typename?: 'TenantRelationObject';
  id?: Maybe<Scalars['String']['output']>;
  identityId?: Maybe<Scalars['String']['output']>;
  relation?: Maybe<Scalars['String']['output']>;
  tenantId?: Maybe<Scalars['String']['output']>;
};

export type UpdateIssueInput = {
  component?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTimeISO']['input']>;
  estimate?: InputMaybe<Scalars['Int']['input']>;
  issueId: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['String']['input']>;
  statusId?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProfileGenderInput = {
  gender: ProfileGender;
};

export type UpdateProfileNameInput = {
  firstName: Scalars['String']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  middleName?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateWorkspaceInput = {
  parentWorkspaceId?: InputMaybe<Scalars['String']['input']>;
};

export type WorkspaceObject = {
  __typename?: 'WorkspaceObject';
  children?: Maybe<Array<WorkspaceObject>>;
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  parentWorkspaceId?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  tenantId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type WorkspacePreferenceObject = {
  __typename?: 'WorkspacePreferenceObject';
  tenantId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  workspaceId?: Maybe<Scalars['String']['output']>;
};

export type WorkspaceRelationObject = {
  __typename?: 'WorkspaceRelationObject';
  id?: Maybe<Scalars['String']['output']>;
  identityId?: Maybe<Scalars['String']['output']>;
  relation?: Maybe<Scalars['String']['output']>;
  workspaceId?: Maybe<Scalars['String']['output']>;
};

export type Join__Graph =
  | 'ATTACHMENT'
  | 'AUDIT_SERVICE'
  | 'IDENTITY_SERVICE'
  | 'ISSUES_SERVICE'
  | 'PLATFORM_SERVICE';

export type Link__Purpose =
  /** `EXECUTION` features provide metadata necessary for operation execution. */
  | 'EXECUTION'
  /** `SECURITY` features provide metadata necessary to securely resolve fields. */
  | 'SECURITY';
