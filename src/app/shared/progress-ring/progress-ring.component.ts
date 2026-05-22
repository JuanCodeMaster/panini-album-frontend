import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  template: `
    <div class="ring" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size">
        <circle
          [attr.cx]="size / 2"
          [attr.cy]="size / 2"
          [attr.r]="radius"
          [attr.stroke]="track"
          [attr.stroke-width]="thickness"
          fill="none"
        />
        <circle
          [attr.cx]="size / 2"
          [attr.cy]="size / 2"
          [attr.r]="radius"
          [attr.stroke]="color"
          [attr.stroke-width]="thickness"
          fill="none"
          [attr.stroke-dasharray]="dash + ' ' + circumference"
          stroke-linecap="round"
          class="progress"
        />
      </svg>
      <div class="center" [style.color]="ink">
        <div class="label" [style.font-size.px]="size * 0.32">{{ label }}</div>
        @if (sub) {
          <div class="sub">{{ sub }}</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .ring {
      position: relative;
      display: inline-block;
    }
    svg {
      transform: rotate(-90deg);
    }
    .progress {
      transition: stroke-dasharray 0.5s ease;
    }
    .center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      line-height: 1;
    }
    .label {
      letter-spacing: 0.02em;
    }
    .sub {
      font-size: 9.5px;
      letter-spacing: 0.16em;
      font-family: var(--font-body);
      font-weight: 600;
      opacity: 0.55;
      margin-top: 2px;
      text-transform: uppercase;
    }
  `],
})
export class ProgressRingComponent {
  @Input() value = 0;
  @Input() size = 84;
  @Input() thickness = 8;
  @Input() color = '#D4AF37';
  @Input() track = 'rgba(255,255,255,0.18)';
  @Input() ink = '#FFFFFF';
  @Input() label = '';
  @Input() sub = '';

  get radius(): number {
    return (this.size - this.thickness) / 2;
  }
  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }
  get dash(): number {
    return this.circumference * Math.max(0, Math.min(1, this.value));
  }
}
