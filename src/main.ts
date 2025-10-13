import { NestFactory } from "@nestjs/core";
import { RequestMethod } from "@nestjs/common";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// CORS 설정
	// app.enableCors({
	//   origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
	//   credentials: true,
	//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	//   allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
	// });
	app.enableCors({
		origin: true,
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Accept"],
	});

	// Global prefix for most routes; exclude a couple of CSR-friendly endpoints
	app.setGlobalPrefix("api", {
		exclude: [
			{ path: "uploads", method: RequestMethod.POST },
			{ path: "ir/activities", method: RequestMethod.POST },
		],
	});

	// 개발 환경에서만 Swagger 활성화
	if (process.env.NODE_ENV === "development") {
		const config = new DocumentBuilder()
			.setTitle("Boiler Plate Backend API")
			.setDescription("NestJS Boiler Plate Backend API 문서")
			.setVersion("1.0")
			.addBearerAuth(
				{
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
					name: "JWT",
					description: "Enter JWT token",
					in: "header",
				},
				"JWT-auth", // This name here is important for references
			)
			.build();

		const document = SwaggerModule.createDocument(app, config);
		// Swagger at /api/docs
		SwaggerModule.setup("docs", app, document);
	}

	await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
