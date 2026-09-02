import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("login_rate_limits")
export class LoginRateLimit {
  @PrimaryColumn({ length: 190 }) identifier!: string;
  @Column({ name: "window_started_at", type: "timestamptz" }) windowStartedAt!: Date;
  @Column({ default: 0 }) attempts!: number;
  @Column({ name: "blocked_until", type: "timestamptz", nullable: true }) blockedUntil!: Date | null;
}
