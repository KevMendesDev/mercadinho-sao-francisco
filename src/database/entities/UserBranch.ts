import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column, Unique } from "typeorm";
import type { Relation } from "typeorm";
import { Branch } from "./Branch";
import { User } from "./User";

@Entity("user_branches")
@Unique("uq_user_branch", ["userId", "branchId"])
export class UserBranch {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Column({ name: "branch_id", type: "uuid" }) branchId!: string;

  @ManyToOne(() => User, (user) => user.branchAccesses, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" }) user!: Relation<User>;

  @ManyToOne(() => Branch, (branch) => branch.userAccesses, { onDelete: "CASCADE" })
  @JoinColumn({ name: "branch_id" }) branch!: Relation<Branch>;
}
