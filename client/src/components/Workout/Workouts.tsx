import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Icon,
    Input,
    Checkbox,
    Button,
    Divider,
    Pagination,
    Select,
    Radio,
    Tag,
    Collapse,
    Empty,
    Carousel,
    Typography
} from 'antd';
/*import {
    SearchOutline,
    ArrowLeftOutline,
    SortAscendingOutline,
    SortDescendingOutline,
    FireOutline,
    BulbOutline,
    ToolOutline
} from '@ant-design/icons';*/
import exercisesData from './exercises.json';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Meta } = Card;
const { Option } = Select;

type Exercise = {
    name: string;
    force: string;
    level: string;
    mechanic: string | null;
    equipment: string;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    instructions: string[];
    category: string;
};

type ExerciseFilters = {
    primaryMuscle: string[];
    category: string[];
    level: string[];
    searchQuery: string;
};

type SortOption = {
    field: 'name' | 'level' | 'category';
    direction: 'asc' | 'desc';
};

const MUSCLE_OPTIONS = [
    'ABDOMINALS', 'ADDUCTORS', 'BICEPS', 'CHEST', 'CALVES',
    'LOWER BACK', 'TRICEPS', 'FOREARMS', 'ABDUCTORS',
    'HAMSTRINGS', 'QUADRICEPS', 'SHOULDERS', 'MIDDLE BACK',
    'GLUTES', 'LATS', 'TRAPS', 'NECK'
];

const CATEGORY_OPTIONS = [
    'STRENGTH', 'STRETCHING', 'PLYOMETRICS',
    'STRONGMAN', 'POWERLIFTING', 'CARDIO',
    'OLYMPIC WEIGHTLIFTING'
];

const LEVEL_OPTIONS = ['BEGINNER', 'INTERMEDIATE', 'EXPERT'];

const PAGE_SIZE = 8;

const Workouts: React.FC = () => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
    const [paginatedExercises, setPaginatedExercises] = useState<Exercise[]>([]);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [filters, setFilters] = useState<ExerciseFilters>({
        primaryMuscle: [],
        category: [],
        level: [],
        searchQuery: ''
    });
    const [sortOption, setSortOption] = useState<SortOption>({
        field: 'name',
        direction: 'asc'
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setExercises(exercisesData.exercises);
        setLoading(false);
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, exercises, sortOption]);

    useEffect(() => {
        updatePagination();
    }, [filteredExercises, currentPage]);

    const applyFilters = () => {
        let result = [...exercises];

        // Apply search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            result = result.filter(exercise =>
                exercise.name.toLowerCase().includes(query)
            );
        }

        // Apply primary muscle filter
        if (filters.primaryMuscle.length > 0) {
            result = result.filter(exercise =>
                filters.primaryMuscle.some(muscle =>
                    exercise.primaryMuscles.map(m => m.toUpperCase()).includes(muscle)
                )
            );
        }

        // Apply category filter
        if (filters.category.length > 0) {
            result = result.filter(exercise =>
                filters.category.includes(exercise.category.toUpperCase())
            );
        }

        // Apply level filter
        if (filters.level.length > 0) {
            result = result.filter(exercise =>
                filters.level.includes(exercise.level.toUpperCase())
            );
        }

        // Apply sorting
        result = sortExercises(result);

        setFilteredExercises(result);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const sortExercises = (exercisesToSort: Exercise[]) => {
        return [...exercisesToSort].sort((a, b) => {
            let comparison = 0;

            if (sortOption.field === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortOption.field === 'level') {
                const levelOrder = { beginner: 0, intermediate: 1, expert: 2 };
                comparison = levelOrder[a.level.toLowerCase()] - levelOrder[b.level.toLowerCase()];
            } else if (sortOption.field === 'category') {
                comparison = a.category.localeCompare(b.category);
            }

            return sortOption.direction === 'asc' ? comparison : -comparison;
        });
    };

    const updatePagination = () => {
        const startIdx = (currentPage - 1) * PAGE_SIZE;
        const endIdx = startIdx + PAGE_SIZE;
        setPaginatedExercises(filteredExercises.slice(startIdx, endIdx));
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({
            ...filters,
            searchQuery: e.target.value
        });
    };

    const handleMuscleFilter = (muscle: string, checked: boolean) => {
        const newMuscles = checked
            ? [...filters.primaryMuscle, muscle]
            : filters.primaryMuscle.filter(m => m !== muscle);

        setFilters({
            ...filters,
            primaryMuscle: newMuscles
        });
    };

    const handleCategoryFilter = (category: string, checked: boolean) => {
        const newCategories = checked
            ? [...filters.category, category]
            : filters.category.filter(c => c !== category);

        setFilters({
            ...filters,
            category: newCategories
        });
    };

    const handleLevelFilter = (level: string, checked: boolean) => {
        const newLevels = checked
            ? [...filters.level, level]
            : filters.level.filter(l => l !== level);

        setFilters({
            ...filters,
            level: newLevels
        });
    };

    const handleSortFieldChange = (field: 'name' | 'level' | 'category') => {
        setSortOption({
            ...sortOption,
            field
        });
    };

    const handleSortDirectionChange = (direction: 'asc' | 'desc') => {
        setSortOption({
            ...sortOption,
            direction
        });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleExerciseClick = (exercise: Exercise) => {
        setSelectedExercise(exercise);
    };

    const handleBackToList = () => {
        setSelectedExercise(null);
    };

    const getExerciseImageUrls = (name: string) => {
        const baseName = name.replaceAll(' ', '_').replaceAll('/', '_');
        return [
            `https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/${baseName}/images/0.jpg`,
            `https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/${baseName}/images/1.jpg`
        ];
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Card loading style={{ width: 300 }} />
            </div>
        );
    }

    if (selectedExercise) {
        const imageUrls = getExerciseImageUrls(selectedExercise.name);

        return (
            <div style={{ padding: 24 }}>
                <Button
                    type="link"
                    icon={"arrow-left"}
                    onClick={handleBackToList}
                    style={{ marginBottom: 16 }}
                >
                    Back to exercises
                </Button>

                <Card
                    style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                    bodyStyle={{ padding: 0 }}
                >
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        {/* Content on the left */}
                        <div style={{ flex: 1, padding: 24 }}>
                            <div style={{ marginBottom: 16 }}>
                                <Title level={3} style={{ marginBottom: 8 }}>
                                    {selectedExercise.name}
                                </Title>
                                <div>
                                    <Tag icon={"fire"} color="red" style={{ marginRight: 8, marginBottom: 8 }}>
                                        {selectedExercise.category}
                                    </Tag>
                                    <Tag icon={"bulb"} color="blue" style={{ marginRight: 8, marginBottom: 8 }}>

                                        {selectedExercise.level}
                                    </Tag>
                                    <Tag icon={"tool"} color="orange" style={{ marginBottom: 8 }}>
                                        {selectedExercise.equipment}
                                    </Tag>
                                </div>
                            </div>

                            <Divider orientation="left" style={{ marginTop: 0 }}>
                                <Text strong>Primary Muscles Worked</Text>
                            </Divider>
                            <div style={{ marginBottom: 16 }}>
                                {selectedExercise.primaryMuscles.map(muscle => (
                                    <Tag key={muscle} color="geekblue" style={{ marginRight: 8, marginBottom: 8 }}>
                                        {muscle}
                                    </Tag>
                                ))}
                            </div>

                            {selectedExercise.secondaryMuscles.length > 0 && (
                                <>
                                    <Divider orientation="left">
                                        <Text strong>Secondary Muscles Worked</Text>
                                    </Divider>
                                    <div style={{ marginBottom: 16 }}>
                                        {selectedExercise.secondaryMuscles.map(muscle => (
                                            <Tag key={muscle} color="cyan" style={{ marginRight: 8, marginBottom: 8 }}>
                                                {muscle}
                                            </Tag>
                                        ))}
                                    </div>
                                </>
                            )}

                            <Divider orientation="left">
                                <Text strong>Instructions</Text>
                            </Divider>
                            <ol style={{ paddingLeft: 24, marginBottom: 0 }}>
                                {selectedExercise.instructions.map((step, index) => (
                                    <li key={index} style={{ marginBottom: 8 }}>
                                        <Text>{step}</Text>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* Carousel on the right */}
                        <div style={{ width: '40%', padding: 24 }}>
                            <Carousel
                                autoplay
                                dotPosition="top"
                                style={{ height: 400, background: '#f0f2f5', borderRadius: 12 }}
                            >
                                {imageUrls.map((url, index) => (
                                    <div key={index}>
                                        <img
                                            alt={`${selectedExercise.name} ${index + 1}`}
                                            src={url}
                                            style={{
                                                width: '100%',
                                                height: 400,
                                                objectFit: 'cover',
                                                borderRadius: 12
                                            }}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Image+Not+Available';
                                            }}
                                        />
                                    </div>
                                ))}
                            </Carousel>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: 24, background: '#f5f7fa' }}>
            <Row gutter={[24, 24]}>
                {/* Filters Column */}
                <Col xs={24} sm={24} md={8} lg={6} xl={6}>
                    <Card
                        title="Filters"
                        bordered={false}
                        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}
                    >
                        <Input
                            placeholder="Search exercises..."
                            prefix={<Icon type="search" />}
                            value={filters.searchQuery}
                            onChange={handleSearch}
                            style={{ marginBottom: 24 }}
                            size="large"
                            allowClear
                        />

                        <Collapse
                            defaultActiveKey={['1', '2', '3']}
                            ghost
                            expandIconPosition="right"
                        >
                            <Panel header={<Text strong>Primary Muscles</Text>} key="1">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {MUSCLE_OPTIONS.map(muscle => (
                                        <Checkbox
                                            key={muscle}
                                            checked={filters.primaryMuscle.includes(muscle)}
                                            onChange={e => handleMuscleFilter(muscle, e.target.checked)}
                                        >
                                            {muscle.toLowerCase().replaceAll('_', ' ')}
                                        </Checkbox>
                                    ))}
                                </div>
                            </Panel>

                            <Panel header={<Text strong>Categories</Text>} key="2">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {CATEGORY_OPTIONS.map(category => (
                                        <Checkbox
                                            key={category}
                                            checked={filters.category.includes(category)}
                                            onChange={e => handleCategoryFilter(category, e.target.checked)}
                                        >
                                            {category.toLowerCase()}
                                        </Checkbox>
                                    ))}
                                </div>
                            </Panel>

                            <Panel header={<Text strong>Difficulty Levels</Text>} key="3">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {LEVEL_OPTIONS.map(level => (
                                        <Checkbox
                                            key={level}
                                            checked={filters.level.includes(level)}
                                            onChange={e => handleLevelFilter(level, e.target.checked)}
                                        >
                                            {level.toLowerCase()}
                                        </Checkbox>
                                    ))}
                                </div>
                            </Panel>
                        </Collapse>
                    </Card>
                </Col>

                {/* Results Column */}
                <Col xs={24} sm={24} md={16} lg={18} xl={18}>
                    <Card
                        bordered={false}
                        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}
                        bodyStyle={{ padding: 24 }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 24,
                            flexWrap: 'wrap'
                        }}>
                            <Text strong style={{ fontSize: 16, marginRight: 16, marginBottom: 8 }}>
                                {filteredExercises.length} exercises found
                            </Text>

                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                <Select
                                    value={sortOption.field}
                                    onChange={handleSortFieldChange}
                                    style={{ width: 140, marginRight: 16, marginBottom: 8 }}
                                    size="middle"
                                >
                                    <Option value="name">Name</Option>
                                    <Option value="level">Difficulty</Option>
                                    <Option value="category">Category</Option>
                                </Select>

                                <Radio.Group
                                    value={sortOption.direction}
                                    onChange={(e) => handleSortDirectionChange(e.target.value)}
                                    buttonStyle="solid"
                                    size="middle"
                                >
                                    <Radio.Button value="asc">
                                        <Icon type="sort-ascending" /> Asc
                                    </Radio.Button>
                                    <Radio.Button value="desc">
                                        <Icon type="sort-descending" /> Desc
                                    </Radio.Button>
                                </Radio.Group>
                            </div>
                        </div>

                        {filteredExercises.length > 0 ? (
                            <>
                                <Row gutter={[16, 16]}>
                                    {paginatedExercises.map(exercise => (
                                        <Col key={exercise.name} xs={24} sm={12} md={8} lg={8} xl={6}>
                                            <Card
                                                hoverable
                                                cover={
                                                    <div style={{ height: 180, overflow: 'hidden' }}>
                                                        <img
                                                            alt={exercise.name}
                                                            src={getExerciseImageUrls(exercise.name)[0]}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                transition: 'transform 0.3s'
                                                            }}
                                                            onMouseOver={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                            }}
                                                            onMouseOut={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                            }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x180?text=Exercise';
                                                            }}
                                                        />
                                                    </div>
                                                }
                                                onClick={() => handleExerciseClick(exercise)}
                                                style={{ borderRadius: 8, overflow: 'hidden' }}
                                                bodyStyle={{ padding: 16 }}
                                            >
                                                <Meta
                                                    title={<Text ellipsis={{ tooltip: exercise.name }}>{exercise.name}</Text>}
                                                    description={
                                                        <div>
                                                            <Tag color="blue" style={{ marginRight: 8, marginBottom: 8 }}>{exercise.category}</Tag>
                                                            <Tag color="green" style={{ marginBottom: 8 }}>{exercise.level}</Tag>
                                                        </div>
                                                    }
                                                />
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginTop: 24
                                }}>
                                    <Pagination
                                        current={currentPage}
                                        total={filteredExercises.length}
                                        pageSize={PAGE_SIZE}
                                        onChange={handlePageChange}
                                        showSizeChanger={false}
                                        showQuickJumper
                                        size="default"
                                        style={{ marginTop: 24 }}
                                    />
                                </div>
                            </>
                        ) : (
                            <Empty
                                image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                                imageStyle={{ height: 120 }}
                                description={
                                    <Text type="secondary">
                                        No exercises match your filters. Try adjusting your search criteria.
                                    </Text>
                                }
                                style={{ margin: '40px 0' }}
                            >
                                <Button
                                    type="primary"
                                    onClick={() => setFilters({
                                        primaryMuscle: [],
                                        category: [],
                                        level: [],
                                        searchQuery: ''
                                    })}
                                >
                                    Clear All Filters
                                </Button>
                            </Empty>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Workouts;