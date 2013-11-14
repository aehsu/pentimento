function draw_line(line) {
    var ctx = pentimento.state.context;
    ctx.beginPath();
    ctx.moveTo(line.from.x, line.from.y);
    ctx.lineTo(line.to.x, line.to.y);

    if (pentimento.state.pressure) { //some fancy stuff based on pressure
        /*var avg_pressure = 0.5 * (line.from.pressure + line.to.pressure)

        if (pressure_color) {
            var alpha = (1 - 0.5) + 0.5 * avg_pressure
            line.color = 'rgba(32,32,32,' + alpha + ')' // todo use defaults
        }
        else {
            line.color = 'rgba(64,64,64,1)'  // todo use defaults
        }

        if (pressure_width) {
            line.width = 1 + Math.round(max_extra_line_width * avg_pressure) // todo use defaults
        }
        else {
            line.width = 2 // todo use defaults
        }

        canvas.draw_line(line)*/
    } else {
        ctx.strokeStyle = pentimento.state.color;
        ctx.lineWidth = pentimento.state.width;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}
