import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import {
  RestaurantStockController,
  RestaurantStockLedgersController,
  StockBalancesController,
  StockLedgersController,
} from './stock.controller';
import { StockRepository } from './stock.repository';
import { StockService } from './stock.service';

@Module({
  controllers: [
    StockLedgersController,
    StockBalancesController,
    RestaurantStockLedgersController,
    RestaurantStockController,
  ],
  imports: [CommonModule],
  providers: [StockRepository, StockService],
})
export class StockModule {}
