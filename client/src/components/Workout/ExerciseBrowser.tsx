import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Input,
    Checkbox,
    Button,
    Divider,
    Pagination,
    Select,
    Radio,
    Tag,
    Collapse,
    Empty
} from 'antd';
import {
    SearchOutlined,
    ArrowLeftOutlined,
    SortAscendingOutlined,
    SortDescendingOutlined
} from '@ant-design/icons';
import exercisesData from './exercises.json';

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
    'LOWER_BACK', 'TRICEPS', 'FOREARMS', 'ABDUCTORS',
    'HAMSTRINGS', 'QUADRICEPS', 'SHOULDERS', 'MIDDLE_BACK',
    'GLUTES', 'LATS', 'TRAPS', 'NECK'
];

const CATEGORY_OPTIONS = [
    'STRENGTH', 'STRETCHING', 'PLYOMETRICS',
    'STRONGMAN', 'POWERLIFTING', 'CARDIO',
    'OLYMPIC_WEIGHTLIFTING'
];

const LEVEL_OPTIONS = ['BEGINNER', 'INTERMEDIATE', 'EXPERT'];

const PAGE_SIZE = 8;

const ExerciseBrowser: React.FC = () => {
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

    const getExerciseImageUrl = (name: string) => {
        return `https://your-image-server.com/${encodeURIComponent(name)}.jpg`;
    };

    if (loading) {
        return <div>Loading exercises...</div>;
    }

    if (selectedExercise) {
        return (
            <div className="exercise-detail">
                <Button
                    type="link"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBackToList}
                >
                    Back to exercises
                </Button>

                <Card
                    cover={
                        <img
                            alt={selectedExercise.name}
                            src={getExerciseImageUrl(selectedExercise.name)}
                            style={{ maxHeight: '400px', objectFit: 'cover' }}
                        />
                    }
                >
                    <Meta
                        title={selectedExercise.name}
                        description={
                            <>
                                <Tag color="blue">{selectedExercise.category}</Tag>
                                <Tag color="green">{selectedExercise.level}</Tag>
                                <Tag color="orange">{selectedExercise.equipment}</Tag>

                                <Divider orientation="left">Primary Muscles</Divider>
                                <div>
                                    {selectedExercise.primaryMuscles.map(muscle => (
                                        <Tag key={muscle}>{muscle}</Tag>
                                    ))}
                                </div>

                                {selectedExercise.secondaryMuscles.length > 0 && (
                                    <>
                                        <Divider orientation="left">Secondary Muscles</Divider>
                                        <div>
                                            {selectedExercise.secondaryMuscles.map(muscle => (
                                                <Tag key={muscle}>{muscle}</Tag>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <Divider orientation="left">Instructions</Divider>
                                <ol>
                                    {selectedExercise.instructions.map((step, index) => (
                                        <li key={index}>{step}</li>
                                    ))}
                                </ol>
                            </>
                        }
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="exercise-browser" style={{ padding: 20}}>
            <Row gutter={16}>
                {/* Filters Column */}
                <Col xs={24} sm={24} md={8} lg={6} xl={6}>
                    <div className="filters-section">
                        <Input
                            placeholder="Search exercises..."
                            prefix={<SearchOutlined />}
                            value={filters.searchQuery}
                            onChange={handleSearch}
                            style={{ marginBottom: '20px' }}
                        />

                        <Collapse defaultActiveKey={['1', '2', '3']} ghost>
                            <Panel header="Primary Muscles" key="1">
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {MUSCLE_OPTIONS.map(muscle => (
                                        <Checkbox
                                            key={muscle}
                                            checked={filters.primaryMuscle.includes(muscle)}
                                            onChange={e => handleMuscleFilter(muscle, e.target.checked)}
                                        >
                                            {muscle.toLowerCase().replace('_', ' ')}
                                        </Checkbox>
                                    ))}
                                </div>
                            </Panel>

                            <Panel header="Categories" key="2">
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
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

                            <Panel header="Levels" key="3">
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                    </div>
                </Col>

                {/* Results Column */}
                <Col xs={24} sm={24} md={16} lg={18} xl={18}>
                    <div className="results-section">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}>
                            <div>
                                Showing {filteredExercises.length} exercises
                            </div>

                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Sort by:</span>
                                    <Select
                                        value={sortOption.field}
                                        onChange={handleSortFieldChange}
                                        style={{ width: '120px' }}
                                    >
                                        <Option value="name">Name</Option>
                                        <Option value="level">Difficulty</Option>
                                        <Option value="category">Category</Option>
                                    </Select>
                                </div>

                                <Radio.Group
                                    value={sortOption.direction}
                                    onChange={(e) => handleSortDirectionChange(e.target.value)}
                                    buttonStyle="solid"
                                >
                                    <Radio.Button value="asc">
                                        <SortAscendingOutlined />
                                    </Radio.Button>
                                    <Radio.Button value="desc">
                                        <SortDescendingOutlined />
                                    </Radio.Button>
                                </Radio.Group>
                            </div>
                        </div>

                        {filteredExercises.length > 0 ? (
                            <>
                                <Row gutter={[16, 16]}>
                                    {paginatedExercises.map(exercise => (
                                        <Col key={exercise.name} xs={24} sm={12} md={8} lg={6} xl={6}>
                                            <Card
                                                hoverable
                                                cover={
                                                    <img
                                                        alt={exercise.name}
                                                        src={getExerciseImageUrl(exercise.name)}
                                                        style={{ height: '150px', objectFit: 'cover' }}
                                                    />
                                                }
                                                onClick={() => handleExerciseClick(exercise)}
                                            >
                                                <Meta
                                                    title={exercise.name}
                                                    description={
                                                        <>
                                                            <Tag color="blue">{exercise.category}</Tag>
                                                            <Tag color="green">{exercise.level}</Tag>
                                                        </>
                                                    }
                                                />
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginTop: '24px'
                                }}>
                                    <Pagination
                                        current={currentPage}
                                        total={filteredExercises.length}
                                        pageSize={PAGE_SIZE}
                                        onChange={handlePageChange}
                                        showSizeChanger={false}
                                    />
                                </div>
                            </>
                        ) : (
                            <Empty
                                description="No exercises match your filters. Try adjusting your search criteria."
                                style={{ margin: '40px 0' }}
                            />
                        )}
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default ExerciseBrowser;