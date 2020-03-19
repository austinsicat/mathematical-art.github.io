'use strict';

/**Inspired by Daniel Sheefmahhnnn's Coding Challenge #76 (https://thecodingtrain.com/CodingChallenges/076-10print.html)
 * which he developed from the book 10 PRINT (https://10print.org/).
 */
 {

	function TenPrint() {
		const me = this;
		this.title = '10 PRINT';
		this.optionsDocument = downloadDocument('ten-print.html').then(function (optionsDoc) {
			optionsDoc.getElementById('ten-print-zoom').addEventListener('input', function (event) {
				me.zoomOut = parseFloat(this.value);
				progressiveBackgroundGen(me);
			});

			optionsDoc.getElementById('ten-print-angle').addEventListener('input', function (event) {
				me.angle = parseFloat(this.value) * Math.PI / 180;
				progressiveBackgroundGen(me);
			});

			optionsDoc.getElementById('ten-print-line-width').addEventListener('input', function (event) {
				me.strokeRatio = parseFloat(this.value);
				progressiveBackgroundGen(me);
			});

			optionsDoc.getElementById('ten-print-gap-probability').addEventListener('input', function (event) {
				me.blankProbability = parseFloat(this.value);
				progressiveBackgroundGen(me);
			});

			optionsDoc.getElementById('ten-print-probability').addEventListener('input', function (event) {
				me.probability = parseFloat(this.value);
				progressiveBackgroundGen(me);
			});

			function changeColor(index) {
				return function (event) {
					me.colors[index] = this.value;
					progressiveBackgroundGen(me);
				};
			}

			optionsDoc.querySelectorAll('input[type=color]').forEach(function (item, index) {
				item.addEventListener('input', changeColor(index));
			});

			return optionsDoc;
		});

		this.angle = Math.atan2(1, 0.936);
		this.zoomOut = 1;
		// Probability of a cell being left blank
		this.blankProbability = 0;
		// Probability of a forward slash given not blank
		this.probability = 0.5;
		this.colors = ['#887ecb', '#887ecb', '#887ecb', '#887ecb'];
		// Stroke width as a proportion of the cell's area.
		this.strokeRatio = 0.12;
	}

	backgroundGenerators.set('ten-print', new TenPrint());

	TenPrint.prototype.generate = function* () {
		const beginTime = performance.now();
		const canvas = document.getElementById('background-canvas');
		const context = canvas.getContext('2d');
		const cellsDownScreen = 25;
		const tan = Math.tan(Math.max(this.angle, 0.0001));
		const sqrTan = Math.min(Math.sqrt(tan), 1);
		const zoom = this.zoomOut / sqrTan;

		const canvasHeight = canvas.height;
		const heightProportion = canvasHeight / screen.height;
		let cellsDownCanvas = heightProportion * cellsDownScreen * zoom;
		const cellHeight = Math.min(Math.max(Math.round(canvasHeight / cellsDownCanvas), 2), canvasHeight);
		cellsDownCanvas = Math.max(Math.round(canvasHeight / cellHeight), 1);

		const canvasWidth = canvas.width;
		const cellWidth = Math.max(Math.min(Math.round(cellHeight / tan), 200000), 2);
		const cellsAcrossCanvas = Math.max(Math.round(canvasWidth / cellWidth), 1);

		const diagonalDist = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
		const style1 = context.createRadialGradient(0, canvasHeight, 0, 0, canvasHeight, diagonalDist);
		style1.addColorStop(0, this.colors[0]);
		style1.addColorStop(1, this.colors[1]);
		const style2 = context.createRadialGradient(canvasWidth, canvasHeight, 0, canvasWidth, canvasHeight, diagonalDist);
		style2.addColorStop(0, this.colors[3]);
		style2.addColorStop(1, this.colors[2]);

		const lineWidth = Math.max(Math.round(0.5 * this.strokeRatio * cellHeight / sqrTan), 1);

		const blankSpacing = Math.max(Math.trunc(1 / this.blankProbability), 1);
		let spacingShift = Math.ceil(blankSpacing / 2);
		while (blankSpacing % spacingShift === 0 && spacingShift > 1) {
			spacingShift--;
		}
		const blankProbability =  this.blankProbability * blankSpacing;
		const maxBlankRun = Math.round(1 / (1 - this.blankProbability) + 0.49) - 1;

		let blankRunLength = 0;
		let blankDiffusion = 0;
		context.clearRect(0, 0, canvasWidth, canvasHeight);
		for (let cellY = 0; cellY < cellsDownCanvas; cellY++) {
			const yTop = cellY * cellHeight;
			const yBottom = yTop + cellHeight;

			if (blankSpacing > 1) {
				blankRunLength = 0;
			}

			for (let cellX = 0; cellX < cellsAcrossCanvas; cellX++) {
				const cellNumber = cellX + cellY * spacingShift + 1;
				const randomBlank = Math.random();
				if (cellNumber % blankSpacing === 0 &&  randomBlank < blankProbability) {
					if (blankRunLength < maxBlankRun) {
						blankRunLength++;
						blankDiffusion = 0;
						continue;
					} else {
						blankDiffusion += blankProbability;
					}
				}
				if (blankDiffusion >= 1 && blankRunLength < maxBlankRun) {
					blankRunLength++;
					blankDiffusion--;
					continue;
				}

				blankRunLength = 0;
				const xLeft = cellX * cellWidth;
				const xRight = xLeft + cellWidth;

				const p = Math.random();
				context.beginPath();

				if (p < this.probability) {
					// Forward slash
					context.fillStyle = style1;
					context.moveTo(xLeft, yBottom - lineWidth);
					context.lineTo(xRight, yTop - lineWidth);
					context.lineTo(xRight, yTop + lineWidth);
					context.lineTo(xLeft, yBottom + lineWidth);
					context.closePath();
				} else {
					// Backslash
					context.fillStyle = style2;
					context.moveTo(xLeft, yTop - lineWidth);
					context.lineTo(xRight, yBottom - lineWidth);
					context.lineTo(xRight, yBottom + lineWidth);
					context.lineTo(xLeft, yTop + lineWidth);
					context.closePath();
				}
				context.fill();
			}
			if (cellY % 20 === 19 && performance.now() >= beginTime + 20) {
				yield;
			}
		}
	}

}
