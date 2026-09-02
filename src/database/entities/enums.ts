export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  OPERATOR = "OPERATOR",
}

export enum StockMovementType {
  ENTRY = "ENTRY",
  EXIT = "EXIT",
  ADJUSTMENT = "ADJUSTMENT",
}

export enum MovementSource {
  MANUAL = "MANUAL",
  PDV = "PDV",
  INTEGRATION = "INTEGRATION",
  SYSTEM = "SYSTEM",
}
