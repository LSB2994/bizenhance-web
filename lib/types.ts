// ─────────────────────── API Envelope ───────────────────────
export interface ApiResponse<T> {
    status: string;
    statusCode: number;
    message: string;
    payload: T;
    date: string;
}

export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

// ─────────────────────── Auth ───────────────────────
export interface LoginRequest {
    username: string;
    password: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface VerifyResetOtpRequest {
    email: string;
    otp: string;
}

export interface ResetPasswordRequest {
    email: string;
    otp: string;
    newPassword: string;
}

/** Response payload for POST /api/auth/forgot-password (OTP sent by email; no payload) */
export interface ForgotPasswordPayload {
    // empty; success message indicates OTP was sent if account exists
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    user: AuthUserDTO;
}

export interface AuthUserDTO {
    id: number;
    username: string;
    email: string;
    fullName: string;
    roleId: number;
    roleName: string;
    bizId: number;
    permissions: string[];
}

// ─────────────────────── User ───────────────────────
export interface UserDTO {
    id: number;
    fullName: string;
    username: string;
    email: string;
    phoneNumber: string;
    status: string;
    createdDate: string;
    modifiedDate: string;
}

export interface CurrentUserDTO {
    id: number;
    fullName: string;
    username: string;
    email: string;
    phoneNumber: string;
    status: string;
    createdDate: string;
    modifiedDate: string;
    bizId: number;
    roleId: number;
    roleName: string;
    admin: boolean;
    roles: string[];
    permissions: string[];
}

export interface CreateUserRequest {
    username: string;
    password: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    status?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

// ─────────────────────── Business ───────────────────────
export interface BizDTO {
    id: number;
    nameKh: string;
    nameEng: string;
    tel: string;
    address: string;
    logo: string;
    status: string;
    createdDate: string;
    modifiedDate: string;
}

export interface CreateBizRequest {
    nameKh: string;
    nameEng?: string;
    tel?: string;
    address?: string;
    logo?: string;
    status?: string;
}

// ─────────────────────── Staff / Biz User ───────────────────────
export interface StaffDTO {
    id: number;
    username: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    status: string;
    bizUserStatus: string;
    roleNames: string[];
    menuIds?: number[];
    menuNames?: string[];
    createdDate: string;
    modifiedDate: string;
}

export interface CreateBizUserRequest {
    username: string;
    password: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    status?: string;
    managerId?: number;
}

export interface CreateUserWithRoleRequest {
    username: string;
    password: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    status?: string;
    roleIds?: number[];
    menuIds?: number[];
}

export interface UpdateStaffRequest {
    fullName?: string;
    phoneNumber?: string;
    status?: string;
    bizUserStatus?: string;
    /** Optional: assign this role (replaces current). */
    roleId?: number;
    /** Optional: menu permissions for this user in this biz (used when roleId is set). */
    menuIds?: number[];
}

export interface AssignRoleToUserRequest {
    roleId: number;
    menuIds?: number[];
}

export interface AssignAdminRequest {
    userId: number;
    menuIds: number[];
}

// ─────────────────────── Role ───────────────────────
export interface RoleDTO {
    id: number;
    roleName: string;
    description: string;
    status: string;
    createdDate: string;
    modifiedDate: string;
}

export interface CreateRoleRequest {
    roleName: string;
    description?: string;
    status?: string;
}

// ─────────────────────── System Menu ───────────────────────
export interface SystemMenuDTO {
    id: number;
    menuName: string;
    description: string;
    parentId?: number;
    sorting?: number;
    status: string;
    createdDate: string;
    modifiedDate: string;
}

export interface CreateSystemMenuRequest {
    menuName: string;
    description?: string;
    parentId?: string;
    sorting?: number;
    status?: string;
}

// ─────────────────────── Category ───────────────────────
export interface CategoryDTO {
    id: number;
    name: string;
    description: string;
    bizId: number;
    status: string;
    createdDate: string;
    modifiedDate: string;
}

export interface CreateCategoryRequest {
    categoryName: string;
    description?: string;
    bizId: number;
    status?: string;
}

export interface CreateCategoryMeRequest {
    categoryName: string;
    description?: string;
    status?: string;
}

// ─────────────────────── Item ───────────────────────
export interface ItemDTO {
    id: number;
    bizId: number;
    itemCode: string;
    name: string;
    description: string;
    image: string;
    unitPrice: number;
    categoryId: number;
    categoryName: string;
    itemUsageTypeId: number;
    itemUsageTypeName: string;
    status: string;
    qty: number;
    createdDate: string;
    modifiedDate: string;
}

export interface CreateItemRequest {
    name: string;
    itemCode?: string;
    description?: string;
    image?: string;
    price: number;
    bizId: number;
    categoryId: number;
    itemUsageTypeId: number;
    status?: string;
    qty?: number;
}

export interface ItemUsageTypeDTO {
    id: number;
    name: string;
    description: string;
    status: string;
    createdDate: string;
    modifiedDate: string;
}

// ─────────────────────── Stock ───────────────────────
export interface StockDTO {
    id: number;
    bizId: number;
    byUserId: number;
    itemId: number;
    itemName: string;
    type: string;
    qty: number;
    purposeId: number;
    purposeName: string;
    status: string;
    createdDate: string;
    modifiedDate: string;
}

export interface CreateStockRequest {
    type: string;
    qty: number;
    purposeId?: number;
    byUserId: number;
    itemId: number;
    status?: string;
}

export interface StockBalanceDTO {
    itemId: number;
    itemName: string;
    quantity: number;
}

export interface StockPurposeDTO {
    id: number;
    bizId?: number;
    name: string;
    description?: string;
    /** IN, OUT, or ADJUST */
    type?: string;
    status: string;
    createdDate: string;
    modifiedDate: string;
}

// ─────────────────────── Sales ───────────────────────
export interface SalesDTO {
    id: number;
    byUserId: number;
    itemId: number;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    status: string;
    createdDate: string;
    modifiedDate: string;
}

export interface CreateSalesRequest {
    byUserId: number;
    itemId: number;
    quantity: number;
    status?: string;
}

// ─────────────────────── Sale Transactions ───────────────────────
export interface SaleHeaderDTO {
    id: number;
    bizId: number;
    saleNumber: string;
    saleDate: string;
    totalAmount: number;
    createdByUserId: number;
    createdByUserName: string;
    status: string;
    createdDate: string;
    modifiedDate: string;
    lines: SaleLineDTO[];
}

export interface SaleLineDTO {
    id: number;
    itemId: number;
    itemName: string;
    itemCode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface SaleItemRequest {
    itemId: number;
    quantity: number;
}

export interface CreateSaleTransactionRequest {
    /** Optional: when omitted, backend uses current user's biz. */
    bizId?: number;
    saleNumber?: string;
    items: SaleItemRequest[];
    status?: string;
}

// ─────────────────────── Invoices ───────────────────────
export interface InvoiceHeaderDTO {
    id: number;
    bizId: number;
    invoiceName: string;
    description: string;
    logo: string;
    status: string;
    createdDate: string;
    modifiedDate: string;
}

export interface CreateInvoiceHeaderRequest {
    bizId: number;
    invoiceName: string;
    description?: string;
    logo?: string;
    status?: string;
}

export interface InvoiceSignatureDTO {
    id: number;
    headerId: number;
    signatureName: string;
    signature: string;
    status: string;
    createdDate: string;
    modifiedDate: string;
}

export interface InvoiceNoteDTO {
    id: number;
    headerId: number;
    noteTitle: string;
    note: string;
    status: string;
    createdDate: string;
    modifiedDate: string;
}

// ─────────────────────── Files ───────────────────────
export interface FileUploadResponse {
    id: number;
    fileName: string;
    originalFileName: string;
    contentType: string;
    fileSize: number;
    filePath: string;
    fileUrl: string;
    description: string;
    uploadedAt: string;
    uploadedBy: string;
}
