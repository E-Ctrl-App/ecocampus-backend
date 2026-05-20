import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('classrooms')
  getClassrooms() {
    return this.dashboardService.getClassrooms();
  }

  @Get('devices')
  getDevicesByClassroom() {
    return this.dashboardService.getDevicesByClassroom();
  }

  @Get('activity')
  getActivity() {
    return this.dashboardService.getActivity();
  }
}
