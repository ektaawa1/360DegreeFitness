from setuptools import setup, find_packages

setup(
    name="backend",
    version="0.1.0",
    packages=find_packages(),
    python_requires=">=3.12.7",
    install_requires=[
        "fastapi==0.104.1",
        "uvicorn==0.24.0",
        "pydantic[email]>=2.4.2",
        "python-dotenv==1.0.0",
        "motor==3.3.2",
        "pymongo==4.6.1",
        "mongoengine==0.27.0",
        "passlib==1.7.4",
        "python-jose==3.3.0",
        "bcrypt==4.0.1",
        "httpx==0.25.0",
        "openai==1.3.0",
        "langchain",
        "langchain-core",
        "langchain-community",
        "pymongo[srv]==4.6.1",
        "tiktoken==0.5.2"
    ],
    extras_require={
        "dev": [
            "pytest==7.4.3",
            "black==23.11.0",
            "flake8==6.1.0",
            "mypy==1.7.0"
        ]
    }
) 