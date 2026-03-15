import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-ma-position',
  imports: [CommonModule, RouterLink, Navbar],
  templateUrl: './ma-position.html',
  styleUrl: './ma-position.css',
})
export class MaPosition {}
