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
  DateTimeISO: { input: unknown; output: unknown; }
  /** A field whose value conforms to the standard internet email address format as specified in HTML Spec: https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address. */
  EmailAddress: { input: unknown; output: unknown; }
  /** A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier. */
  UUID: { input: unknown; output: unknown; }
  join__FieldSet: { input: unknown; output: unknown; }
  link__Import: { input: unknown; output: unknown; }
};

export type AuditIdentityObject = {
  __typename?: 'AuditIdentityObject';
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  fullName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  middleName?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type AuditLogObject = {
  __typename?: 'AuditLogObject';
  action?: Maybe<Scalars['String']['output']>;
  actor?: Maybe<AuditIdentityObject>;
  actorId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  entityId?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  organizationId?: Maybe<Scalars['String']['output']>;
  tenantId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type ChecklistCountsObject = {
  __typename?: 'ChecklistCountsObject';
  completedCount?: Maybe<Scalars['Int']['output']>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type ChecklistEntryObject = {
  __typename?: 'ChecklistEntryObject';
  checklistId?: Maybe<Scalars['String']['output']>;
  completed?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  createdById?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  orderIndex?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type ChecklistObject = {
  __typename?: 'ChecklistObject';
  completedCount?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  createdById?: Maybe<Scalars['String']['output']>;
  entries?: Maybe<Array<ChecklistEntryObject>>;
  id?: Maybe<Scalars['String']['output']>;
  itemId?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type CreateChecklistEntryInput = {
  checklistId: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type CreateChecklistInput = {
  itemId: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
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

export type CreateItemAttachmentInput = {
  attachmentId: Scalars['String']['input'];
  itemId: Scalars['String']['input'];
  mimeType: Scalars['String']['input'];
  name: Scalars['String']['input'];
  originalName: Scalars['String']['input'];
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateItemAttachmentUploadRequestInput = {
  contentType: Scalars['String']['input'];
  filename: Scalars['String']['input'];
  itemId: Scalars['String']['input'];
  size: Scalars['Int']['input'];
};

export type CreateItemInput = {
  component?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTimeISO']['input']>;
  estimate?: InputMaybe<Scalars['Int']['input']>;
  listId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  parentItemId?: InputMaybe<Scalars['String']['input']>;
  priority: Scalars['String']['input'];
  statusId: Scalars['ID']['input'];
  type: Scalars['String']['input'];
};

export type CreateListInput = {
  name: Scalars['String']['input'];
  spaceId: Scalars['String']['input'];
};

export type CreateOfficeTypeInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  parentOfficeTypeId?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  tenantId: Scalars['String']['input'];
};

export type CreateOrganizationInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  officeTypeId: Scalars['String']['input'];
  parentOrganizationId?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  tenantId: Scalars['String']['input'];
};

export type CreateOrganizationRelationInput = {
  identityId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  relation: Scalars['String']['input'];
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

export type CreateSpaceInput = {
  name: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};

export type CreateStatusInput = {
  color: Scalars['String']['input'];
  listId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type CreateTagInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
  spaceId?: InputMaybe<Scalars['String']['input']>;
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

export type DeleteIdentityInput = {
  identityId: Scalars['String']['input'];
};

export type DeleteStatusInput = {
  id: Scalars['ID']['input'];
  replacementStatusId?: InputMaybe<Scalars['ID']['input']>;
};

export type FindStatusesOptions = {
  listId: Scalars['String']['input'];
};

export type GetSubItemsInput = {
  parentItemId: Scalars['String']['input'];
};

export type GetTagsInput = {
  organizationId: Scalars['String']['input'];
  spaceId?: InputMaybe<Scalars['String']['input']>;
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
  organizations?: Maybe<Array<OrganizationRelationObject>>;
  platform?: Maybe<Array<PlatformRelationObject>>;
  tenants?: Maybe<Array<TenantRelationObject>>;
};

export type ItemAttachmentObject = {
  __typename?: 'ItemAttachmentObject';
  attachmentId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  createdById?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  itemId?: Maybe<Scalars['String']['output']>;
  mimeType?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  originalName?: Maybe<Scalars['String']['output']>;
  previewUrl?: Maybe<Scalars['String']['output']>;
  processing?: Maybe<ItemAttachmentProcessingObject>;
  size?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type ItemAttachmentProcessingObject = {
  __typename?: 'ItemAttachmentProcessingObject';
  label?: Maybe<Scalars['String']['output']>;
};

export type ItemAttachmentUploadHeaderObject = {
  __typename?: 'ItemAttachmentUploadHeaderObject';
  key?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type ItemAttachmentUploadTargetObject = {
  __typename?: 'ItemAttachmentUploadTargetObject';
  expiresAt?: Maybe<Scalars['String']['output']>;
  headers?: Maybe<Array<ItemAttachmentUploadHeaderObject>>;
  uploadRequestId?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type ItemGroupPageInfo = {
  __typename?: 'ItemGroupPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
};

export type ItemObject = {
  __typename?: 'ItemObject';
  checklistCounts?: Maybe<ChecklistCountsObject>;
  checklists?: Maybe<Array<ChecklistObject>>;
  component?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['DateTimeISO']['output']>;
  estimate?: Maybe<Scalars['Int']['output']>;
  hasChildren?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  list?: Maybe<ListObject>;
  name?: Maybe<Scalars['String']['output']>;
  orderIndex?: Maybe<Scalars['Int']['output']>;
  parentItem?: Maybe<ItemObject>;
  priority?: Maybe<Scalars['String']['output']>;
  statusId?: Maybe<Scalars['String']['output']>;
  subItems?: Maybe<Array<ItemObject>>;
  tags?: Maybe<Array<TagObject>>;
};

export type ItemStatusGroupObject = {
  __typename?: 'ItemStatusGroupObject';
  items?: Maybe<Array<ItemObject>>;
  pageInfo?: Maybe<ItemGroupPageInfo>;
  status?: Maybe<StatusObject>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type ListObject = {
  __typename?: 'ListObject';
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  spaceId?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createChecklist?: Maybe<ChecklistObject>;
  createChecklistEntry?: Maybe<ChecklistEntryObject>;
  createIdentity?: Maybe<IdentityObject>;
  createItem?: Maybe<Scalars['String']['output']>;
  createItemAttachment?: Maybe<ItemAttachmentObject>;
  createItemAttachmentUploadRequest?: Maybe<ItemAttachmentUploadTargetObject>;
  createList?: Maybe<Scalars['String']['output']>;
  createOfficeType?: Maybe<OfficeTypeObject>;
  createOrganization?: Maybe<OrganizationObject>;
  createOrganizationRelation?: Maybe<OrganizationRelationObject>;
  createPhotoUploadRequest?: Maybe<PhotoUploadTargetObject>;
  createPlatformRelation?: Maybe<PlatformRelationObject>;
  createProfile?: Maybe<ProfileObject>;
  createSpace?: Maybe<SpaceObject>;
  createStatus?: Maybe<StatusObject>;
  createTag?: Maybe<TagObject>;
  createTenant?: Maybe<TenantObject>;
  createTenantRelation?: Maybe<TenantRelationObject>;
  deleteAttachment?: Maybe<Scalars['String']['output']>;
  deleteChecklist?: Maybe<Scalars['Boolean']['output']>;
  deleteChecklistEntry?: Maybe<Scalars['Boolean']['output']>;
  deleteIdentity?: Maybe<Scalars['String']['output']>;
  deleteItem?: Maybe<Scalars['String']['output']>;
  deleteItemAttachment?: Maybe<Scalars['Boolean']['output']>;
  deleteOfficeType?: Maybe<Scalars['String']['output']>;
  deleteOrganization?: Maybe<Scalars['String']['output']>;
  deleteOrganizationRelation?: Maybe<Scalars['Boolean']['output']>;
  deletePlatformRelation?: Maybe<Scalars['String']['output']>;
  deleteStatus?: Maybe<Scalars['Boolean']['output']>;
  deleteTag?: Maybe<Scalars['Boolean']['output']>;
  deleteTenant?: Maybe<Scalars['String']['output']>;
  deleteTenantRelation?: Maybe<Scalars['Boolean']['output']>;
  hello?: Maybe<Scalars['String']['output']>;
  reorderChecklistEntries?: Maybe<Array<ChecklistEntryObject>>;
  reorderListItems?: Maybe<Array<ItemObject>>;
  reorderStatuses?: Maybe<Array<StatusObject>>;
  setItemTags?: Maybe<Array<TagObject>>;
  setMyOrganizationPreference?: Maybe<OrganizationPreferenceObject>;
  updateChecklist?: Maybe<ChecklistObject>;
  updateChecklistEntry?: Maybe<ChecklistEntryObject>;
  updateItem?: Maybe<Scalars['String']['output']>;
  updateList?: Maybe<Scalars['String']['output']>;
  updateOrganization?: Maybe<OrganizationObject>;
  updateProfileGender?: Maybe<ProfileObject>;
  updateProfileName?: Maybe<ProfileObject>;
  updateSpace?: Maybe<Scalars['String']['output']>;
  updateStatus?: Maybe<StatusObject>;
  updateTag?: Maybe<TagObject>;
};


export type MutationCreateChecklistArgs = {
  input: CreateChecklistInput;
};


export type MutationCreateChecklistEntryArgs = {
  input: CreateChecklistEntryInput;
};


export type MutationCreateIdentityArgs = {
  input: CreateIdentityInput;
};


export type MutationCreateItemArgs = {
  input: CreateItemInput;
};


export type MutationCreateItemAttachmentArgs = {
  input: CreateItemAttachmentInput;
};


export type MutationCreateItemAttachmentUploadRequestArgs = {
  input: CreateItemAttachmentUploadRequestInput;
};


export type MutationCreateListArgs = {
  input: CreateListInput;
};


export type MutationCreateOfficeTypeArgs = {
  input: CreateOfficeTypeInput;
};


export type MutationCreateOrganizationArgs = {
  input: CreateOrganizationInput;
};


export type MutationCreateOrganizationRelationArgs = {
  input: CreateOrganizationRelationInput;
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


export type MutationCreateSpaceArgs = {
  input: CreateSpaceInput;
};


export type MutationCreateStatusArgs = {
  input: CreateStatusInput;
};


export type MutationCreateTagArgs = {
  input: CreateTagInput;
};


export type MutationCreateTenantArgs = {
  input: CreateTenantInput;
};


export type MutationCreateTenantRelationArgs = {
  input: CreateTenantRelationInput;
};


export type MutationDeleteAttachmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteChecklistArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteChecklistEntryArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteIdentityArgs = {
  input: DeleteIdentityInput;
};


export type MutationDeleteItemArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteItemAttachmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteOfficeTypeArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteOrganizationRelationArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeletePlatformRelationArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteStatusArgs = {
  input: DeleteStatusInput;
};


export type MutationDeleteTagArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteTenantArgs = {
  id: Scalars['String']['input'];
  platformId: Scalars['String']['input'];
};


export type MutationDeleteTenantRelationArgs = {
  id: Scalars['String']['input'];
};


export type MutationReorderChecklistEntriesArgs = {
  input: ReorderChecklistEntriesInput;
};


export type MutationReorderListItemsArgs = {
  input: ReorderListItemsInput;
};


export type MutationReorderStatusesArgs = {
  input: ReorderStatusesInput;
};


export type MutationSetItemTagsArgs = {
  input: SetItemTagsInput;
};


export type MutationSetMyOrganizationPreferenceArgs = {
  organizationId: Scalars['String']['input'];
};


export type MutationUpdateChecklistArgs = {
  input: UpdateChecklistInput;
};


export type MutationUpdateChecklistEntryArgs = {
  input: UpdateChecklistEntryInput;
};


export type MutationUpdateItemArgs = {
  input: UpdateItemInput;
};


export type MutationUpdateListArgs = {
  input: UpdateListInput;
};


export type MutationUpdateOrganizationArgs = {
  id: Scalars['String']['input'];
  input: UpdateOrganizationInput;
};


export type MutationUpdateProfileGenderArgs = {
  input: UpdateProfileGenderInput;
};


export type MutationUpdateProfileNameArgs = {
  input: UpdateProfileNameInput;
};


export type MutationUpdateSpaceArgs = {
  input: UpdateSpaceInput;
};


export type MutationUpdateStatusArgs = {
  input: UpdateStatusInput;
};


export type MutationUpdateTagArgs = {
  input: UpdateTagInput;
};

export type OfficeTypeObject = {
  __typename?: 'OfficeTypeObject';
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  parentOfficeTypeId?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  tenantId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type OrganizationObject = {
  __typename?: 'OrganizationObject';
  children?: Maybe<Array<OrganizationObject>>;
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  officeTypeId?: Maybe<Scalars['String']['output']>;
  parentOrganizationId?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  tenantId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type OrganizationPreferenceObject = {
  __typename?: 'OrganizationPreferenceObject';
  organizationId?: Maybe<Scalars['String']['output']>;
  tenantId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type OrganizationRelationObject = {
  __typename?: 'OrganizationRelationObject';
  id?: Maybe<Scalars['String']['output']>;
  identityId?: Maybe<Scalars['String']['output']>;
  organizationId?: Maybe<Scalars['String']['output']>;
  relation?: Maybe<Scalars['String']['output']>;
};

export type PaginatedListObject = {
  __typename?: 'PaginatedListObject';
  rowCount?: Maybe<Scalars['Float']['output']>;
  rows?: Maybe<Array<ListObject>>;
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
  firstName?: Maybe<Scalars['String']['output']>;
  fullName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  identityId?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  middleName?: Maybe<Scalars['String']['output']>;
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

export type Query = {
  __typename?: 'Query';
  attachmentServiceHealth?: Maybe<Scalars['String']['output']>;
  findIdentities?: Maybe<Array<IdentityObject>>;
  findStatuses?: Maybe<Array<StatusObject>>;
  getAuditLogs?: Maybe<Array<AuditLogObject>>;
  getChecklists?: Maybe<Array<ChecklistObject>>;
  getIdentities?: Maybe<Array<PlatformIdentityObject>>;
  getIdentityRelations?: Maybe<IdentityRelationsObject>;
  getItem?: Maybe<ItemObject>;
  getItemAttachments?: Maybe<Array<ItemAttachmentObject>>;
  getItemAuditLogs?: Maybe<Array<AuditLogObject>>;
  getItemTags?: Maybe<Array<TagObject>>;
  getList?: Maybe<ListObject>;
  getListItems?: Maybe<Array<ItemStatusGroupObject>>;
  getLists?: Maybe<PaginatedListObject>;
  getMyOrganizationPreference?: Maybe<OrganizationPreferenceObject>;
  getMyOrganizations?: Maybe<Array<OrganizationObject>>;
  getMyTenants?: Maybe<Array<TenantObject>>;
  getOfficeType?: Maybe<OfficeTypeObject>;
  getOfficeTypes?: Maybe<Array<OfficeTypeObject>>;
  getOrganization?: Maybe<OrganizationObject>;
  getOrganizationRelation?: Maybe<OrganizationRelationObject>;
  getOrganizationRelations?: Maybe<Array<OrganizationRelationObject>>;
  getOrganizations?: Maybe<Array<OrganizationObject>>;
  getPlatformRelation?: Maybe<PlatformRelationObject>;
  getPlatformRelations?: Maybe<Array<PlatformRelationObject>>;
  getSpace?: Maybe<SpaceObject>;
  getSpaces?: Maybe<Array<SpaceObject>>;
  getSubItems?: Maybe<Array<ItemObject>>;
  getTags?: Maybe<Array<TagObject>>;
  getTenant?: Maybe<TenantObject>;
  getTenantRelation?: Maybe<TenantRelationObject>;
  getTenantRelations?: Maybe<Array<TenantRelationObject>>;
  getTenants?: Maybe<Array<TenantObject>>;
  hello?: Maybe<HelloXyz>;
  hello2?: Maybe<Scalars['String']['output']>;
};


export type QueryFindStatusesArgs = {
  input: FindStatusesOptions;
};


export type QueryGetAuditLogsArgs = {
  entityId: Scalars['String']['input'];
  entityType: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};


export type QueryGetChecklistsArgs = {
  itemId: Scalars['String']['input'];
};


export type QueryGetIdentitiesArgs = {
  platformId: Scalars['String']['input'];
};


export type QueryGetIdentityRelationsArgs = {
  identityId: Scalars['String']['input'];
};


export type QueryGetItemArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetItemAttachmentsArgs = {
  itemId: Scalars['String']['input'];
};


export type QueryGetItemAuditLogsArgs = {
  itemId: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};


export type QueryGetItemTagsArgs = {
  itemId: Scalars['String']['input'];
};


export type QueryGetListArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetListItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  listId: Scalars['String']['input'];
  statusId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetListsArgs = {
  spaceId: Scalars['String']['input'];
};


export type QueryGetOfficeTypeArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetOfficeTypesArgs = {
  tenantId: Scalars['String']['input'];
};


export type QueryGetOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetOrganizationRelationArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetOrganizationRelationsArgs = {
  identityId?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['String']['input'];
  relation?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetOrganizationsArgs = {
  parentOrganizationId?: InputMaybe<Scalars['String']['input']>;
  tenantId: Scalars['String']['input'];
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
  organizationId: Scalars['String']['input'];
};


export type QueryGetSubItemsArgs = {
  input: GetSubItemsInput;
};


export type QueryGetTagsArgs = {
  input: GetTagsInput;
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

export type ReorderChecklistEntriesInput = {
  checklistId: Scalars['String']['input'];
  ids: Array<Scalars['String']['input']>;
};

export type ReorderListItemsInput = {
  itemIds: Array<Scalars['String']['input']>;
  listId: Scalars['ID']['input'];
  statusId: Scalars['ID']['input'];
};

export type ReorderStatusesInput = {
  listId: Scalars['ID']['input'];
  statusIds: Array<Scalars['String']['input']>;
};

export type SetItemTagsInput = {
  itemId: Scalars['String']['input'];
  tagIds: Array<Scalars['String']['input']>;
};

export type SpaceObject = {
  __typename?: 'SpaceObject';
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  createdById?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  organizationId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type StatusObject = {
  __typename?: 'StatusObject';
  color?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  listId?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  orderIndex?: Maybe<Scalars['Int']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type TagObject = {
  __typename?: 'TagObject';
  color: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  spaceId?: Maybe<Scalars['String']['output']>;
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

export type UpdateChecklistEntryInput = {
  completed?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['String']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateChecklistInput = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type UpdateItemInput = {
  component?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTimeISO']['input']>;
  estimate?: InputMaybe<Scalars['Int']['input']>;
  itemId: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['String']['input']>;
  statusId?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateListInput = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type UpdateOrganizationInput = {
  parentOrganizationId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProfileGenderInput = {
  gender: ProfileGender;
};

export type UpdateProfileNameInput = {
  firstName: Scalars['String']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  middleName?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSpaceInput = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type UpdateStatusInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTagInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Join__Graph =
  | 'ATTACHMENT'
  | 'AUDIT_SERVICE'
  | 'IDENTITY_SERVICE'
  | 'ITEMS_SERVICE'
  | 'PLATFORM_SERVICE';

export type Link__Purpose =
  /** `EXECUTION` features provide metadata necessary for operation execution. */
  | 'EXECUTION'
  /** `SECURITY` features provide metadata necessary to securely resolve fields. */
  | 'SECURITY';
